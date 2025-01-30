import type { InstanceOptions } from '@vtex/api'
import type { AppSettings, Category } from 'ssesandbox04.catalog-importer'

import {
  batch,
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

  private async getProductAndSkuIds(categoryTree: Category[]) {
    const firstLevelCategories = [...categoryTree]
    const maxPerPage = 250
    let result: ProductAndSkuIds['data'] = {}

    const getFromNextCategory = async () => {
      const category = firstLevelCategories.shift()

      if (!category) return
      let from = 1
      let to = maxPerPage

      const getRange = async () => {
        const { data, range } = await this.get<ProductAndSkuIds>(
          ENDPOINTS.product.listByCategory(category.id, from, to)
        )

        result = { ...result, ...data }
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

    return result
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

  public async getProducts(categoryTree: Category[] = []) {
    const productAndSkuIds = await this.getProductAndSkuIds(categoryTree)
    const productIds = Object.keys(productAndSkuIds)
    const categories = this.flatCategoryTree(categoryTree)
    const products: ProductPayload[] = []
    const skuIds: number[] = []

    await batch(
      productIds,
      async (id) => {
        const product = await this.getProductDetails(id)
        const { IsActive, CategoryId, BrandId } = product
        const inCategoryTree = categories.find(
          (c) => c.id === String(CategoryId)
        )

        if (!IsActive || !inCategoryTree || !productAndSkuIds[id].length) return

        const CategoryPath = this.getCategoryPath(CategoryId, categoryTree)
        const BrandName = await this.getBrandDetails(String(BrandId)).then(
          (b) => b.Name
        )

        products.push({ ...product, CategoryPath, BrandName })
        skuIds.push(...productAndSkuIds[id])
      },
      GET_DETAILS_CONCURRENCY
    )

    return { products, skuIds }
  }

  public async generateProductAndSkuFiles(
    executionImportId: string,
    categoryTree: Category[] = []
  ) {
    const productAndSkuIds = await this.getProductAndSkuIds(categoryTree)
    const productIds = Object.keys(productAndSkuIds)
    const categories = this.flatCategoryTree(categoryTree)

    const products: ProductPayload[] = []

    const productDetailsFile = new FileManager(
      `productDetails-${executionImportId}`
    )

    const skuIdsFile = new FileManager(`skuIds-${executionImportId}`)

    const skuIds: number[] = []

    await batch(
      productIds,
      async (id) => {
        const product = await this.getProductDetails(id)
        const { IsActive, CategoryId, BrandId } = product
        const inCategoryTree = categories.find(
          (c) => c.id === String(CategoryId)
        )

        if (!IsActive || !inCategoryTree || !productAndSkuIds[id].length) return

        const CategoryPath = this.getCategoryPath(CategoryId, categoryTree)
        const BrandName = await this.getBrandDetails(String(BrandId)).then(
          (b) => b.Name
        )

        products.push({ ...product, CategoryPath, BrandName })

        skuIds.push(...productAndSkuIds[id])
      },
      GET_DETAILS_CONCURRENCY
    )

    products.forEach((product) => {
      productDetailsFile.append(`${JSON.stringify(product)}\n`)
    })

    skuIds.forEach((id) => {
      skuIdsFile.append(`${id}\n`)
    })

    const sourceProductsTotal = products.length
    const sourceSkusTotal = skuIds.length

    return { sourceProductsTotal, sourceSkusTotal }
  }

  private async getSpecificationGroup(id: ID) {
    return this.get<SpecificationGroup>(ENDPOINTS.specification.getGroup(id))
  }

  private async getSpecification(id: ID) {
    const { FieldGroupId, ...specification } = await this.get<Specification>(
      ENDPOINTS.specification.get(id)
    )

    const { Name: GroupName } = await this.getSpecificationGroup(FieldGroupId)

    return { ...specification, GroupName }
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

  public async getSkus(skuIdsFile: FileManager) {
    const skuLineIterator = skuIdsFile.getLineIterator()

    const skuIds: number[] = []

    for await (const line of skuLineIterator) {
      skuIds.push(Number(line))
    }

    return batch(
      skuIds,
      (id) => this.getSkuDetails(id),
      GET_DETAILS_CONCURRENCY
    )
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

  public async getPrices(
    skuIdsFile: FileManager,
    sourceSkuProductFile: FileManager
  ) {
    const skuLineIterator = skuIdsFile.getLineIterator()

    const skuIds: number[] = []

    for await (const line of skuLineIterator) {
      skuIds.push(Number(line))
    }

    const prices = await batch(
      skuIds,
      async (id) => {
        const productId = (await sourceSkuProductFile.findLine(id)) as string

        return this.getPrice(id, productId /* mapSourceSkuProduct[id] */)
      },
      GET_DETAILS_CONCURRENCY
    )

    return prices.filter((p) => p !== null) as PriceDetails[]
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

  public async getInventories(
    skuIdsFile: FileManager,
    sourceSkuSellerStockFile: FileManager
  ) {
    const skuLineIterator = skuIdsFile.getLineIterator()

    const skuIds: number[] = []

    for await (const line of skuLineIterator) {
      skuIds.push(Number(line))
    }

    return batch(
      skuIds,
      async (id) => {
        const sellerStock =
          +((await sourceSkuSellerStockFile.findLine(id)) ?? 0) || undefined

        return this.getInventory(id, sellerStock)
      },
      GET_DETAILS_CONCURRENCY
    )
  }
}
