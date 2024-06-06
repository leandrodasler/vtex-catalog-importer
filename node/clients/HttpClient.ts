import type { IOContext, IOResponse, InstanceOptions } from '@vtex/api'
import { ExternalClient } from '@vtex/api'
import type { AppSettingsInput } from 'ssesandbox04.catalog-importer'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export default class HttpClient extends ExternalClient {
  protected settings?: AppSettingsInput

  constructor(context: IOContext, options?: InstanceOptions) {
    super('', context, options)
  }

  public setSettings(settings: AppSettingsInput) {
    this.settings = settings
  }

  protected getOptions(): InstanceOptions {
    const { vtexAppKey, vtexAppToken } = this.settings ?? {}

    return {
      ...this.options,
      headers: {
        ...this.options?.headers,
        VtexIdclientAutcookie: this.context.adminUserAuthToken as string,
        ...(vtexAppKey && { 'X-VTEX-API-AppKey': vtexAppKey }),
        ...(vtexAppToken && { 'X-VTEX-API-AppToken': vtexAppToken }),
      },
    }
  }

  protected getUrl(path: string) {
    return this.settings?.account
      ? `http://${this.settings?.account}.myvtex.com/${path}`
      : path
  }

  protected async request<T, B = never>(
    path: string,
    method: HttpMethod = 'GET',
    body?: B
  ): Promise<IOResponse<T>> {
    const url = this.getUrl(path)
    const options = this.getOptions()

    // eslint-disable-next-line no-console
    console.log('======================================================')
    // eslint-disable-next-line no-console
    console.log(`HttpClient ${method}:`, { url, options })
    // eslint-disable-next-line no-console
    console.log('======================================================')

    switch (method) {
      case 'POST':
        return this.http.postRaw(url, body, options)

      case 'PUT':
        return this.http.putRaw(url, body, options)

      case 'PATCH':
        return this.http.patch(url, body, options)

      case 'DELETE':
        return this.http.delete(url, options)

      default:
        return this.http.getRaw(url, options)
    }
  }

  public async get<R>(path: string): Promise<IOResponse<R>> {
    return this.request<R>(path, 'GET')
  }

  public async post<R, B>(path: string, body: B): Promise<IOResponse<R>> {
    return this.request<R, B>(path, 'POST', body)
  }

  public async put<R, B>(path: string, body: B): Promise<IOResponse<R>> {
    return this.request<R, B>(path, 'PUT', body)
  }

  public async patch<R, B>(path: string, body: B): Promise<IOResponse<R>> {
    return this.request<R, B>(path, 'PATCH', body)
  }

  public async delete<R>(path: string): Promise<IOResponse<R>> {
    return this.request<R>(path, 'DELETE')
  }
}
