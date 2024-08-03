import type { InstanceOptions, Maybe } from '@vtex/api'

import { ENDPOINTS, sequentialBatch } from '../helpers'
import HttpClient from './HttpClient'

export default class TargetCatalog extends HttpClient {
  protected getRequestConfig(): InstanceOptions {
    return {
      ...this.options,
      headers: {
        ...this.options?.headers,
        VtexIdclientAutcookie: this.context.authToken ?? '',
      },
    }
  }

  protected getUrl(path: string) {
    return `http://${this.context.account}.${ENDPOINTS.host}${path}`
  }

  public async createBrand<T extends BrandDetails>(payload: Partial<T>) {
    return this.post<T, Partial<T>>(ENDPOINTS.brand.set, payload)
  }

  public async createCategory<T extends CategoryDetails>(payload: Partial<T>) {
    return this.post<T, Partial<T>>(ENDPOINTS.category.set, payload)
  }

  public async getProductByRefId(refId: string) {
    if (!refId) return null

    return this.get<Maybe<ProductDetails>>(
      ENDPOINTS.product.getByRefId(refId)
    ).catch(() => null)
  }

  public async createProduct<T extends ProductDetails>(payload: Partial<T>) {
    return this.post<T, Partial<T>>(ENDPOINTS.product.set, payload)
  }

  public async updateProduct<T extends ProductDetails>(
    id: number,
    payload: Partial<T>
  ) {
    return this.put<T, Partial<T>>(
      ENDPOINTS.product.updateOrDetails(id),
      payload
    )
  }

  public async getSkuByRefId(refId: string) {
    if (!refId) return null

    return this.get<Maybe<SkuDetails>>(ENDPOINTS.sku.getByRefId(refId)).catch(
      () => null
    )
  }

  public async createSku<T extends SkuDetails>(payload: Partial<T>) {
    return this.post<T, Partial<T>>(ENDPOINTS.sku.set, payload)
  }

  public async updateSku<T extends SkuDetails>(
    id: number,
    payload: Partial<T>
  ) {
    return this.put<T, Partial<T>>(ENDPOINTS.sku.updateOrDetails(id), payload)
  }

  private async associateProductSpecification(
    productId: ID,
    payload: AssociatedSpecification
  ) {
    return this.put(ENDPOINTS.product.setSpecification(productId), payload)
  }

  public async associateProductSpecifications(
    productId: ID,
    specifications: ProductSpecificationPayload[]
  ) {
    return sequentialBatch(
      specifications,
      async ({ Name: FieldName, Value: FieldValues, GroupName }) => {
        await this.associateProductSpecification(productId, {
          FieldName,
          FieldValues,
          GroupName,
          RootLevelSpecification: false,
        })
      }
    )
  }

  private async associateSkuSpecification(
    skuId: ID,
    payload: AssociatedSpecification
  ) {
    return this.put(ENDPOINTS.sku.setSpecification(skuId), payload)
  }

  public async associateSkuSpecifications(
    skuId: ID,
    specifications: SkuSpecification[]
  ) {
    return sequentialBatch(
      specifications,
      async ({ FieldName, FieldValues, FieldGroupName: GroupName }) => {
        await this.associateSkuSpecification(skuId, {
          FieldName,
          FieldValues,
          GroupName,
          RootLevelSpecification: false,
        })
      }
    )
  }

  /* remove this after */
  public async getProductIds() {
    const maxPerPage = 250
    let result: ProductAndSkuIds['data'] = {}
    let from = 1
    let to = maxPerPage

    const getRange = async () => {
      const { data, range } = await this.get<ProductAndSkuIds>(
        ENDPOINTS.product.listAll(from, to)
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
    const productIds = Object.keys(result)

    return productIds
  }

  /* remove this after */
  private async deleteBrand(id: ID) {
    return this.delete(ENDPOINTS.brand.updateOrDetails(id))
      .catch(() => {
        const newName = `DELETED-${id}-${Date.now()}`

        return this.put<BrandDetails, Partial<BrandDetails>>(
          ENDPOINTS.brand.updateOrDetails(id),
          {
            Name: newName,
            LinkId: newName,
            Active: false,
          }
        )
      })
      .catch(() => {})
  }

  /* remove this after */
  private async deleteCategory(id: ID) {
    return this.put<CategoryDetails, Partial<CategoryDetails>>(
      ENDPOINTS.category.updateOrDetails(id),
      { Name: 'DELETED' }
    ).catch(() => {})
  }

  /* remove this after */
  private async deleteProduct(id: ID) {
    const newName = `DELETED-${id}-${Date.now()}`

    return this.get<ProductDetails>(ENDPOINTS.product.updateOrDetails(id))
      .then((product) =>
        this.put<ProductDetails, Partial<ProductDetails>>(
          ENDPOINTS.product.updateOrDetails(id),
          {
            ...product,
            Name: newName,
            LinkId: newName,
            RefId: newName,
            IsActive: false,
          }
        )
      )
      .catch(() => {})
  }

  /* remove this after */
  public async deleteEntity(entity: string, id: ID) {
    if (!entity || !id) return null

    switch (entity) {
      case 'brand':
        return this.deleteBrand(id)

      case 'category':
        return this.deleteCategory(id)

      case 'product':
        return this.deleteProduct(id)

      default:
        return null
    }
  }
}
