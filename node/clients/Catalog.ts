import type { InstanceOptions } from '@vtex/api'

import { ENDPOINTS } from '../helpers'
import HttpClient from './HttpClient'

export default class Catalog extends HttpClient {
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

  public async updateBrand(payload: BrandDetails, id: string | number) {
    return this.put<BrandDetails>(ENDPOINTS.brand.updateOrDetails(id), payload)
  }

  public async deleteBrand(id: string | number) {
    return this.delete(ENDPOINTS.brand.updateOrDetails(id)).catch(() => {})
  }
}
