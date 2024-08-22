import type { InstanceOptions } from '@vtex/api'
import type { AppSettings, Category } from 'ssesandbox04.catalog-importer'

import { batch, ENDPOINTS, GET_SKUS_CONCURRENCY } from '../helpers'
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

  private async getBrandDetails({ id }: Brand) {
    return this.get<BrandDetails>(ENDPOINTS.brand.updateOrDetails(id))
  }

  public async getBrands() {
    return this.get<Brand[]>(ENDPOINTS.brand.list).then((data) =>
      batch(data, (brand) => this.getBrandDetails(brand))
    )
  }

  private async getCategoryDetails({ id }: Category) {
    return this.get<CategoryDetails>(ENDPOINTS.category.updateOrDetails(id))
  }

  public async getCategories(categories: Category[]) {
    return batch(categories, (category) => this.getCategoryDetails(category))
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

  public async getProducts(categoryTree: Category[] = []) {
    const productAndSkuIds = await this.getProductAndSkuIds(categoryTree)
    const productIds = Object.keys(productAndSkuIds)
    const categories = this.flatCategoryTree(categoryTree)
    const data: ProductDetails[] = []
    const skuIds: number[] = []

    await batch(productIds, async (id) => {
      const product = await this.getProductDetails(id)
      const { IsActive, CategoryId } = product
      const inCategoryTree = categories.find((c) => c.id === String(CategoryId))

      if (!IsActive || !inCategoryTree || !productAndSkuIds[id].length) return

      data.push(product)
      skuIds.push(...productAndSkuIds[id])
    })

    return { data, skuIds }
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
      batch(data, async ({ Id, ...rest }) => ({
        ...(await this.getSpecification(Id)),
        ...rest,
      }))
    )
  }

  private async getSkuDetails(id: ID) {
    return this.get<SkuDetails>(ENDPOINTS.sku.updateOrDetails(id))
  }

  public async getSkus(skuIds: number[] = []) {
    return batch(skuIds, (id) => this.getSkuDetails(id), GET_SKUS_CONCURRENCY)
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

  public async getPrices(skuIds: number[], mapSourceSkuProduct: EntityMap) {
    const prices = await batch(
      skuIds,
      (id) => this.getPrice(id, mapSourceSkuProduct[id]),
      GET_SKUS_CONCURRENCY
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
    skuIds: number[],
    mapSourceSkuSellerStock: EntityMap
  ) {
    return batch(
      skuIds,
      (id) => this.getInventory(id, mapSourceSkuSellerStock[id]),
      GET_SKUS_CONCURRENCY
    )
  }
}
