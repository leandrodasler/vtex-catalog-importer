import type { InstanceOptions, Maybe } from '@vtex/api'

import { ENDPOINTS } from '../helpers'
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

  public async createBrand(payload: Partial<BrandDetails>) {
    return this.post<BrandDetails, Partial<BrandDetails>>(
      ENDPOINTS.brand.set,
      payload
    )
  }

  public async createCategory(payload: Partial<CategoryDetails>) {
    return this.post<CategoryDetails, Partial<CategoryDetails>>(
      ENDPOINTS.category.set,
      payload
    )
  }

  public async createProduct(payload: Partial<ProductDetails>) {
    return this.post<ProductDetails, Partial<ProductDetails>>(
      ENDPOINTS.product.set,
      payload
    )
  }

  public async updateProduct(id: number, payload: Partial<ProductDetails>) {
    return this.put<ProductDetails, Partial<ProductDetails>>(
      ENDPOINTS.product.updateOrDetails(id),
      payload
    )
  }

  public async getProductByRefId(refId: string) {
    if (!refId) return null

    return this.get<Maybe<ProductDetails>>(
      ENDPOINTS.product.getByRefId(refId)
    ).catch(() => null)
  }

  /* remove this after */
  public async getProductIds() {
    const maxPerPage = 250
    let result: ProductAndSkuIds['data'] = {}
    let from = 1
    let to = maxPerPage

    const getRange = async () => {
      const { data, range } = await this.get<ProductAndSkuIds>(
        ENDPOINTS.product.getAll(from, to)
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
  private async deleteBrand(id: string | number) {
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
  private async deleteCategory(id: string | number) {
    return this.put<CategoryDetails, Partial<CategoryDetails>>(
      ENDPOINTS.category.updateOrDetails(id),
      { Name: 'DELETED' }
    ).catch(() => {})
  }

  /* remove this after */
  private async deleteProduct(id: string | number) {
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
  public async deleteEntity(entity: string, id: string | number) {
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
