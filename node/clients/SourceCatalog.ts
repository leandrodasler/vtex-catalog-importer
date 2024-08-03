import type { InstanceOptions, Maybe } from '@vtex/api'
import type { AppSettings, Category } from 'ssesandbox04.catalog-importer'

import { batch, ENDPOINTS } from '../helpers'
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

  public async getCategoryTree() {
    return this.get<Maybe<Category[]>>(ENDPOINTS.category.list)
  }

  public flatCategoryTree(
    categoryTree: Category[],
    level = 0,
    result: Category[][] = []
  ) {
    if (!result[level]) {
      result[level] = []
    }

    categoryTree.forEach((category) => {
      result[level].push(category)
      if (category.children?.length) {
        this.flatCategoryTree(category.children, level + 1, result)
      }
    })

    return result.flat()
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

      if (!IsActive || !inCategoryTree) return

      product.skuIds = productAndSkuIds[id]
      data.push(product)
      skuIds.push(...product.skuIds)
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

  public async getSkuSpecifications(id: ID) {
    return this.get<SkuSpecificationContext>(
      ENDPOINTS.specification.listBySku(id)
    ).then((data) => data.SkuSpecifications)
  }

  private async getSkuDetails(id: ID) {
    return this.get<SkuDetails>(ENDPOINTS.sku.updateOrDetails(id))
  }

  public async getSkus(skuIds: number[] = []) {
    return batch(skuIds, (id) => this.getSkuDetails(id))
  }
}
