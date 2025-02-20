import type { InstanceOptions } from '@vtex/api'
import type { MasterDataEntity } from '@vtex/clients/build/clients/masterData/MasterDataEntity'
import type {
  AppSettings,
  Category,
  ImportExecution,
} from 'ssesandbox04.catalog-importer'

import {
  batch,
  DEFAULT_CONCURRENCY,
  ENDPOINTS,
  FileManager,
  GET_DETAILS_CONCURRENCY,
} from '../helpers'
import HttpClient from './HttpClient'

export default class SourceCatalog extends HttpClient {
  private settings: AppSettings = {}

  public setSettings(settings: AppSettings) {
    this.settings = settings
  }

  protected getRequestConfig(): InstanceOptions {
    const { vtexAppKey, vtexAppToken } = this.settings

    return {
      ...this.options,
      headers: {
        ...this.options?.headers,
        ...(vtexAppKey && { 'X-VTEX-API-AppKey': vtexAppKey }),
        ...(vtexAppToken && { 'X-VTEX-API-AppToken': vtexAppToken }),
      },
    }
  }

  protected getUrl(path: string) {
    return `http://${this.settings.account}.${ENDPOINTS.host}${path}`
  }

  private async getBrandDetails(id: string) {
    return this.get<BrandDetails>(ENDPOINTS.brand.updateOrDetails(id))
  }

  public async getBrands() {
    return this.get<Brand[]>(ENDPOINTS.brand.list).then((data) =>
      batch(
        data.filter((b) => !b.name.includes('DELETED-')),
        (b) => this.getBrandDetails(b.id),
        GET_DETAILS_CONCURRENCY
      )
    )
  }

  private async getCategoryDetails({ id }: Category) {
    return this.get<CategoryDetails>(ENDPOINTS.category.updateOrDetails(id))
  }

  public async getCategories(categories: Category[]) {
    return batch(
      categories,
      (category) => this.getCategoryDetails(category),
      GET_DETAILS_CONCURRENCY
    )
  }

  public async generateCategoryDetailsFile(
    executionImportId: string,
    importExecutionClient: MasterDataEntity<ImportExecution>,
    categories: Category[]
  ) {
    const categoryDetailsFile = new FileManager(
      `categoryDetails-${executionImportId}`
    )

    await categoryDetailsFile.delete()

    const categoryDetailsFileWriteStream = categoryDetailsFile.getWriteStream()

    const promisesFn: Array<() => Promise<number>> = []
    let count = 0
    let index = 0

    for await (const category of categories) {
      const writeInFile = async () => {
        const newCategory = await this.getCategoryDetails(category).catch(
          () => null
        )

        if (newCategory) {
          categoryDetailsFileWriteStream.write(
            `${JSON.stringify(newCategory)}\n`
          )

          return 1
        }

        return 0
      }

      promisesFn.push(writeInFile)

      if (promisesFn.length === GET_DETAILS_CONCURRENCY) {
        const result = await batch(
          promisesFn.splice(0, promisesFn.length),
          (promiseFn) => promiseFn()
        )

        const lastCount = count

        count += result.reduce((a, b) => a + b, 0)
        index += GET_DETAILS_CONCURRENCY

        if (index % DEFAULT_CONCURRENCY === 0 && count !== lastCount) {
          await importExecutionClient
            .update(executionImportId, { sourceCategoriesTotal: count })
            .catch(() => null)
        }
      }
    }

    if (promisesFn.length) {
      await batch(promisesFn.splice(0, promisesFn.length), (promiseFn) =>
        promiseFn()
      )
    }

    categoryDetailsFileWriteStream.end()

    return categoryDetailsFile.getTotalLines()
  }

  private async generateProductAndSkuIdsFile(
    executionImportId: string,
    categoryTree: Category[]
  ) {
    const firstLevelCategories = [...categoryTree]
    const maxPerPage = 250

    const productAndSkuIdsFile = new FileManager(
      `productAndSkuIds-${executionImportId}`
    )

    await productAndSkuIdsFile.delete()

    const productAndSkuIdsFileWriteStream = productAndSkuIdsFile.getWriteStream()

    const getFromNextCategory = async () => {
      const category = firstLevelCategories.shift()

      if (!category) return
      let from = 1
      let to = maxPerPage

      const getRange = async () => {
        const { data, range } = await this.get<ProductAndSkuIds>(
          ENDPOINTS.product.listByCategory(category.id, from, to)
        )

        Object.entries(data).forEach(([productId, skuIds]) => {
          productAndSkuIdsFileWriteStream.write(
            `${JSON.stringify({ productId, skuIds })}\n`
          )
        })

        if (range.total <= to) {
          return
        }

        from += maxPerPage
        to += maxPerPage
        await getRange()
      }

      await getRange()
      await getFromNextCategory()
    }

    await getFromNextCategory()

    productAndSkuIdsFileWriteStream.end()
  }

  private async getProductDetails(id: ID) {
    return this.get<ProductDetails>(ENDPOINTS.product.updateOrDetails(id))
  }

  private findParentCategory(
    id: string,
    categories: Category[]
  ): Category | null {
    for (const category of categories) {
      if (category.children?.some((sub) => sub.id === id)) {
        return category
      }

      if (category.children) {
        const parentCategory = this.findParentCategory(id, category.children)

        if (parentCategory) {
          return parentCategory
        }
      }
    }

    return null
  }

  private findCategory(id: string, categories: Category[]): Category | null {
    for (const category of categories) {
      if (category.id === id) {
        return category
      }

      if (category.children) {
        const subCategory = this.findCategory(id, category.children)

        if (subCategory) {
          return subCategory
        }
      }
    }

    return null
  }

  private getCategoryPath(categoryId: number, categories: Category[]) {
    let id = String(categoryId)
    const category = this.findCategory(id, categories)

    if (!category) return ''

    let parent: Category | null
    const path: string[] = [category.name]

    while ((parent = this.findParentCategory(id, categories))) {
      path.unshift(parent.name)
      id = parent.id
    }

    return path.join('/')
  }

  private getProductResults(results: ProductAndSkuResults[]) {
    return results.reduce((acc, { products }) => acc + products, 0)
  }

  public async generateProductAndSkuFiles(
    executionImportId: string,
    importExecutionClient: MasterDataEntity<ImportExecution>,
    categoryTree: Category[] = []
  ) {
    await this.generateProductAndSkuIdsFile(executionImportId, categoryTree)

    const categories = this.flatCategoryTree(categoryTree)

    const productDetailsFile = new FileManager(
      `productDetails-${executionImportId}`
    )

    await productDetailsFile.delete()

    const productDetailsFileWriteStream = productDetailsFile.getWriteStream()
    const skuIdsFile = new FileManager(`skuIds-${executionImportId}`)

    await skuIdsFile.delete()

    const skuIdsFileWriteStream = skuIdsFile.getWriteStream()

    const productAndSkuIdsFile = new FileManager(
      `productAndSkuIds-${executionImportId}`
    ).getLineIterator()

    const promisesFn: Array<() => Promise<ProductAndSkuResults>> = []
    let sourceProductsTotal = 0
    let index = 0

    for await (const line of productAndSkuIdsFile) {
      const { productId, skuIds } = JSON.parse(line) as {
        productId: string
        skuIds: number[]
      }

      const writeInFiles = async () => {
        const product = await this.getProductDetails(productId)
        const { IsActive, CategoryId, BrandId } = product
        const inCategoryTree = categories.find(
          (c) => c.id === String(CategoryId)
        )

        if (!IsActive || !inCategoryTree || !skuIds.length) {
          return { products: 0, skus: 0 }
        }

        const CategoryPath = this.getCategoryPath(CategoryId, categoryTree)
        const BrandName = await this.getBrandDetails(String(BrandId)).then(
          (b) => b.Name
        )

        const productData = { ...product, CategoryPath, BrandName }

        productDetailsFileWriteStream.write(`${JSON.stringify(productData)}\n`)

        for (const skuId of skuIds) {
          skuIdsFileWriteStream.write(`${skuId}\n`)
        }

        return { products: 1, skus: skuIds.length }
      }

      promisesFn.push(writeInFiles)

      if (promisesFn.length === GET_DETAILS_CONCURRENCY) {
        const results = await batch(
          promisesFn.splice(0, promisesFn.length),
          (promiseFn) => promiseFn()
        )

        const lastSourceProductsTotal = sourceProductsTotal

        sourceProductsTotal += this.getProductResults(results)
        index += GET_DETAILS_CONCURRENCY

        if (
          index % DEFAULT_CONCURRENCY === 0 &&
          sourceProductsTotal !== lastSourceProductsTotal
        ) {
          await importExecutionClient
            .update(executionImportId, { sourceProductsTotal })
            .catch(() => null)
        }
      }
    }

    if (promisesFn.length) {
      await batch(promisesFn.splice(0, promisesFn.length), (promiseFn) =>
        promiseFn()
      )
    }

    productAndSkuIdsFile.removeAllListeners()
    productAndSkuIdsFile.close()
    productDetailsFileWriteStream.end()
    skuIdsFileWriteStream.end()

    return productDetailsFile.getTotalLines()
  }

  private async getSpecificationGroup(id: ID) {
    return this.get<SpecificationGroup>(ENDPOINTS.specification.getGroup(id))
  }

  private async getSpecification(id: ID) {
    const { FieldGroupId, ...specification } = await this.get<Specification>(
      ENDPOINTS.specification.updateOrDetails(id)
    )

    const {
      Name: GroupName,
      Position: GroupPosition,
    } = await this.getSpecificationGroup(FieldGroupId)

    return { ...specification, GroupName, GroupPosition }
  }

  public async getProductSpecifications(id: ID) {
    return this.get<ProductSpecification[]>(
      ENDPOINTS.specification.listByProduct(id)
    ).then((data) =>
      batch(
        data,
        async ({ Id, ...rest }) => ({
          ...(await this.getSpecification(Id)),
          ...rest,
        }),
        GET_DETAILS_CONCURRENCY
      )
    )
  }

  private async getSkuDetails(id: ID) {
    return this.get<SkuDetails>(ENDPOINTS.sku.updateOrDetails(id))
  }

  public async generateSkuDetailsFiles(
    executionImportId: string,
    importExecutionClient: MasterDataEntity<ImportExecution>
  ) {
    const skuIdsFile = new FileManager(`skuIds-${executionImportId}`)
    const skuLineIterator = skuIdsFile.getLineIterator()

    const skuDetailsFile = new FileManager(`skuDetails-${executionImportId}`)

    await skuDetailsFile.delete()

    const skuDetailsFileWriteStream = skuDetailsFile.getWriteStream()

    const promisesFn: Array<() => Promise<number>> = []
    let count = 0
    let index = 0

    for await (const id of skuLineIterator) {
      const writeInFile = async () => {
        const sku = await this.getSkuDetails(id).catch(() => null)

        if (sku) {
          skuDetailsFileWriteStream.write(`${JSON.stringify(sku)}\n`)

          return 1
        }

        return 0
      }

      promisesFn.push(writeInFile)

      if (promisesFn.length === GET_DETAILS_CONCURRENCY) {
        const result = await batch(
          promisesFn.splice(0, promisesFn.length),
          (promiseFn) => promiseFn()
        )

        const lastCount = count

        count += result.reduce((a, b) => a + b, 0)
        index += GET_DETAILS_CONCURRENCY

        if (index % DEFAULT_CONCURRENCY === 0 && count !== lastCount) {
          await importExecutionClient
            .update(executionImportId, { sourceSkusTotal: count })
            .catch(() => null)
        }
      }
    }

    if (promisesFn.length) {
      await batch(promisesFn.splice(0, promisesFn.length), (promiseFn) =>
        promiseFn()
      )
    }

    skuLineIterator.removeAllListeners()
    skuLineIterator.close()
    skuDetailsFileWriteStream.end()

    return skuDetailsFile.getTotalLines()
  }

  private async getSkuFiles(id: ID) {
    return this.get<SkuFileDetails[]>(ENDPOINTS.sku.listOrSetFile(id))
  }

  public async getSkuContext(id: ID, getFiles = true) {
    const context = await this.get<SkuContext>(ENDPOINTS.sku.getContext(id))
    const {
      SkuSpecifications: specifications,
      AlternateIds: { Ean },
    } = context

    const skuFiles = getFiles ? await this.getSkuFiles(id) : []
    const files = skuFiles.map((data) => {
      const { Id, ArchiveId, SkuId, FileLocation, Url, Name, ...file } = data
      const image = context.Images.find((i) => i.FileId === ArchiveId)
      const imageUrl = new URL(image?.ImageUrl ?? Url)

      return {
        ...file,
        Name: Name.replace(/\./g, '-'),
        Url: `${imageUrl.origin}${imageUrl.pathname}`,
      }
    })

    return { Ean, specifications, files }
  }

  private async getSellerPrice(skuId: ID, productId: ID) {
    const [offer] = await this.get<SkuOffer[]>(
      ENDPOINTS.price.listOffers(productId, skuId)
    )

    const salesChannelOffer = offer?.sellersOffers?.find((o) =>
      o.salesChannelOffer.find(({ price }) => price)
    )?.salesChannelOffer?.[0]

    if (salesChannelOffer) {
      const { listPrice, price, availableQuantity } = salesChannelOffer

      return {
        itemId: skuId,
        listPrice,
        costPrice: price,
        basePrice: price,
        markup: null,
        sellerStock: availableQuantity,
      }
    }

    return null
  }

  private async getPrice(skuId: ID, productId: ID) {
    return this.get<PriceDetails>(ENDPOINTS.price.getOrset(skuId)).catch(() =>
      this.getSellerPrice(skuId, productId).catch(() => null)
    )
  }

  public async generatePriceDetailsFile(
    executionImportId: string,
    importExecutionClient: MasterDataEntity<ImportExecution>
  ) {
    const skuIdsFile = new FileManager(`skuIds-${executionImportId}`)
    const sourceSkuProductFile = new FileManager(
      `sourceSkuProduct-${executionImportId}`
    )

    const priceDetailsFile = new FileManager(
      `priceDetails-${executionImportId}`
    )

    await priceDetailsFile.delete()

    const priceDetailsFileWriteStream = priceDetailsFile.getWriteStream()

    const skuLineIterator = skuIdsFile.getLineIterator()
    const promisesFn: Array<() => Promise<number>> = []
    let count = 0
    let index = 0

    for await (const id of skuLineIterator) {
      const writeInFile = async () => {
        const productId = (await sourceSkuProductFile.findLine(id)) as string
        const price = await this.getPrice(id, productId)

        if (price) {
          priceDetailsFileWriteStream.write(`${JSON.stringify(price)}\n`)

          return 1
        }

        return 0
      }

      promisesFn.push(writeInFile)

      if (promisesFn.length === GET_DETAILS_CONCURRENCY) {
        const result = await batch(
          promisesFn.splice(0, promisesFn.length),
          (promiseFn) => promiseFn()
        )

        const lastCount = count

        count += result.reduce((a, b) => a + b, 0)
        index += GET_DETAILS_CONCURRENCY

        if (index % DEFAULT_CONCURRENCY === 0 && count !== lastCount) {
          await importExecutionClient
            .update(executionImportId, { sourcePricesTotal: count })
            .catch(() => null)
        }
      }
    }

    if (promisesFn.length) {
      await batch(promisesFn.splice(0, promisesFn.length), (promiseFn) =>
        promiseFn()
      )
    }

    skuLineIterator.removeAllListeners()
    skuLineIterator.close()
    priceDetailsFileWriteStream.end()

    return priceDetailsFile.getTotalLines()
  }

  private generateInventory(skuId: ID, totalQuantity = 0): SkuInventory {
    return {
      skuId: String(skuId),
      totalQuantity,
      reservedQuantity: 0,
      hasUnlimitedQuantity: false,
    }
  }

  private async getInventory(skuId: ID, sellerStock?: number) {
    return this.get<SkuInventoryBySku>(ENDPOINTS.stock.listBySku(skuId))
      .then(({ balance }) => {
        const inventory =
          balance.find((i) => i.hasUnlimitedQuantity || i.totalQuantity > 0) ??
          balance[0]

        return inventory?.hasUnlimitedQuantity ||
          (inventory?.totalQuantity ?? 0) > 0
          ? { ...inventory, skuId }
          : this.generateInventory(skuId, sellerStock)
      })
      .catch(() => this.generateInventory(skuId, sellerStock))
  }

  public async generateInventoryDetailsFile(
    executionImportId: string,
    importExecutionClient: MasterDataEntity<ImportExecution>
  ) {
    const skuIdsFile = new FileManager(`skuIds-${executionImportId}`)
    const sourceSkuSellerStockFile = new FileManager(
      `sourceSkuSellerStock-${executionImportId}`
    )

    const inventoryDetailsFile = new FileManager(
      `inventoryDetails-${executionImportId}`
    )

    await inventoryDetailsFile.delete()

    const inventoryDetailsFileWriteStream = inventoryDetailsFile.getWriteStream()

    const skuLineIterator = skuIdsFile.getLineIterator()
    const promisesFn: Array<() => Promise<number>> = []
    let count = 0
    let index = 0

    for await (const skuId of skuLineIterator) {
      const writeInFile = async () => {
        const sellerStock =
          +((await sourceSkuSellerStockFile.findLine(skuId)) ?? 0) || undefined

        const inventory = await this.getInventory(skuId, sellerStock)

        if (inventory) {
          inventoryDetailsFileWriteStream.write(
            `${JSON.stringify(inventory)}\n`
          )

          return 1
        }

        return 0
      }

      promisesFn.push(writeInFile)

      if (promisesFn.length === GET_DETAILS_CONCURRENCY) {
        const result = await batch(
          promisesFn.splice(0, promisesFn.length),
          (promiseFn) => promiseFn()
        )

        const lastCount = count

        count += result.reduce((a, b) => a + b, 0)
        index += GET_DETAILS_CONCURRENCY

        if (index % DEFAULT_CONCURRENCY === 0 && count !== lastCount) {
          await importExecutionClient
            .update(executionImportId, { sourceStocksTotal: count })
            .catch(() => null)
        }
      }
    }

    if (promisesFn.length) {
      await batch(promisesFn.splice(0, promisesFn.length), (promiseFn) =>
        promiseFn()
      )
    }

    skuLineIterator.removeAllListeners()
    skuLineIterator.close()
    inventoryDetailsFileWriteStream.end()

    return inventoryDetailsFile.getTotalLines()
  }
}
