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

  private async getSpecificationGroupsByCategory(categoryId: number) {
    const groups = await this.get<SpecificationGroupDetails[]>(
      ENDPOINTS.specificationGroup.list(categoryId)
    ).catch(() => [])

    return groups.filter((group) => group.CategoryId === categoryId)
  }

  public async getSpecificationGroups(categoryTree: Category[]) {
    return batch(this.flatCategoryTree(categoryTree), ({ id }) =>
      this.getSpecificationGroupsByCategory(+id)
    ).then((data) => data.flat())
  }

  private async getSpecificationDetails({ FieldId }: CategorySpecification) {
    return this.get<SpecificationDetails>(
      ENDPOINTS.specification.updateOrDetails(FieldId)
    )
  }

  private async getSpecificationsByCategory(categoryId: string | number) {
    return this.get<CategorySpecification[]>(
      ENDPOINTS.specification.list(categoryId)
    )
      .then((data) => batch(data, (spec) => this.getSpecificationDetails(spec)))
      .catch(() => [])
  }

  public async getSpecifications(categoryTree: Category[]) {
    return batch(this.flatCategoryTree(categoryTree), (category) =>
      this.getSpecificationsByCategory(category.id)
    ).then((data) => data.flat())
  }

  private async getSpecificationValueDetails({
    FieldValueId,
  }: SpecificationValue) {
    return this.get<SpecificationValueDetails>(
      ENDPOINTS.specificationValue.updateOrDetails(FieldValueId)
    )
  }

  private async getSpecificationValuesByFieldId(fieldId: number) {
    return this.get<SpecificationValue[]>(
      ENDPOINTS.specificationValue.list(fieldId)
    )
      .then((data) =>
        batch(data, (value) => this.getSpecificationValueDetails(value))
      )
      .catch(() => [])
  }

  public async getSpecificationValues(fieldIds: number[]) {
    return batch(fieldIds, (fieldId) =>
      this.getSpecificationValuesByFieldId(fieldId)
    ).then((data) => data.flat())
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

  private async getProductDetails(id: string | number) {
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

  public async getProductSpecifications(productId: number) {
    return this.get<AssociatedSpecification[]>(
      ENDPOINTS.product.listOrSetSpecifications(productId)
    )
  }

  private async getSkuDetails(id: string | number) {
    return this.get<SkuDetails>(ENDPOINTS.sku.updateOrDetails(id))
  }

  public async getSkus(skuIds: number[] = []) {
    return batch(skuIds, (id) => this.getSkuDetails(id))
  }

  public async getSkuSpecifications(skuId: number) {
    return this.get<AssociatedSpecification[]>(
      ENDPOINTS.sku.listOrSetSpecifications(skuId)
    )
  }
}
