import type { InstanceOptions, IOContext, IOResponse } from '@vtex/api'
import { ExternalClient } from '@vtex/api'
import type { AppSettingsInput, Category } from 'ssesandbox04.catalog-importer'

import { batch, ENDPOINTS } from '../helpers'

export default class HttpClient extends ExternalClient {
  protected settings?: AppSettingsInput

  constructor(context: IOContext, options?: InstanceOptions) {
    super('', context, options)
  }

  public setSettings(settings: AppSettingsInput) {
    this.settings = settings
  }

  protected getRequestConfig(): InstanceOptions {
    const { vtexAppKey, vtexAppToken } = this.settings ?? {}

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
    return this.settings?.account
      ? `http://${this.settings.account}.${ENDPOINTS.host}${path}`
      : path
  }

  protected async request<Response, Body = Response>(
    path: string,
    method: HttpMethod = 'GET',
    body?: Body
  ) {
    const url = this.getUrl(path)
    const config = this.getRequestConfig()
    const getData = (response: IOResponse<Response>) => response.data

    switch (method) {
      case 'POST':
        return this.http.postRaw<Response>(url, body, config).then(getData)

      case 'PUT':
        return this.http.putRaw<Response>(url, body, config).then(getData)

      case 'PATCH':
        return this.http.patch<Response>(url, body, config)

      case 'DELETE':
        return this.http.delete<Response>(url, config).then(getData)

      default:
        return this.http.getRaw<Response>(url, config).then(getData)
    }
  }

  public async get<Response>(path: string) {
    return this.request<Response>(path, 'GET')
  }

  public async post<Response, Body = Response>(path: string, body: Body) {
    return this.request<Response, Body>(path, 'POST', body)
  }

  public async put<Response, Body = Response>(path: string, body: Body) {
    return this.request<Response, Body>(path, 'PUT', body)
  }

  public async patch<Response, Body = Response>(path: string, body: Body) {
    return this.request<Response, Body>(path, 'PATCH', body)
  }

  public async delete<Response>(path: string) {
    return this.request<Response>(path, 'DELETE')
  }

  public async getDefaultSettings() {
    return this.get<AppSettingsInput>(ENDPOINTS.defaultSettings)
      .catch(() => {
        throw new Error('admin/settings.default.error')
      })
      .then((response) => ({ ...response, useDefault: true }))
  }

  private async getBrandDetails({ id }: Brand) {
    return this.get<BrandDetails>(ENDPOINTS.brand.updateOrDetails(id))
  }

  public async getSourceBrands() {
    return this.get<Brand[]>(ENDPOINTS.brand.get).then((data) =>
      batch(data, (brand) => this.getBrandDetails(brand))
    )
  }

  private async getCategoryDetails({ id }: Category) {
    return this.get<CategoryDetails>(ENDPOINTS.category.updateOrDetails(id))
  }

  public async getSourceCategories(categories: Category[]) {
    return batch(categories, (category) => this.getCategoryDetails(category))
  }
}
