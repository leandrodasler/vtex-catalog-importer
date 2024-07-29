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
    return this.get<Brand[]>(ENDPOINTS.brand.get).then((data) =>
      batch(data, (brand) => this.getBrandDetails(brand))
    )
  }

  public async getCategoryTree() {
    return this.get<Maybe<Category[]>>(ENDPOINTS.category.tree)
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

  private async getProductIds(categoryTree: Category[]) {
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
          ENDPOINTS.product.get(category.id, from, to)
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

    return Object.keys(result)
  }

  private async getProductDetails(id: string | number) {
    return this.get<ProductDetails>(ENDPOINTS.product.updateOrDetails(id))
  }

  public async getProducts(categoryTree: Category[] = []) {
    const productIds = await this.getProductIds(categoryTree)
    const categories = this.flatCategoryTree(categoryTree)
    const products = await batch(productIds, async (id) => {
      const product = await this.getProductDetails(id)
      const { IsActive, CategoryId } = product
      const inCategoryTree = categories.find((c) => c.id === String(CategoryId))

      return IsActive && inCategoryTree ? product : null
    })

    return products.filter((c) => !!c) as ProductDetails[]
  }
}
