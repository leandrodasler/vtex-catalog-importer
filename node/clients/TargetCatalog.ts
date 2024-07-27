import type { InstanceOptions } from '@vtex/api'

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

  public async createBrand(payload: BrandDetails) {
    return this.post<BrandDetails>(ENDPOINTS.brand.set, payload)
  }

  public async deleteBrand(id: string | number) {
    return this.delete(ENDPOINTS.brand.updateOrDetails(id)).catch(() => {})
  }

  public async createCategory(payload: CategoryDetails) {
    return this.post<CategoryDetails>(ENDPOINTS.category.set, payload)
  }

  public async deleteCategory(id: string | number) {
    return this.put<CategoryDetails, Partial<CategoryDetails>>(
      ENDPOINTS.category.updateOrDetails(id),
      { Name: 'DELETED' }
    ).catch(() => {})
  }

  public async createProduct(payload: ProductDetails) {
    return this.post<ProductDetails>(ENDPOINTS.product.set, payload)
  }
}
