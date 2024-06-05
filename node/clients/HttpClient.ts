import type { IOContext, IOResponse, InstanceOptions } from '@vtex/api'
import { ExternalClient } from '@vtex/api'
import type { AppSettingsInput } from 'ssesandbox04.catalog-importer'

export default class HttpClient extends ExternalClient {
  private settings?: AppSettingsInput

  constructor(context: IOContext, options?: InstanceOptions) {
    super('', context, {
      ...options,
      headers: {
        ...options?.headers,
        VtexIdclientAutcookie: context.adminUserAuthToken as string,
      },
    })
  }

  public setSettings(settings: AppSettingsInput) {
    this.settings = settings
  }

  private getAuthHeaders() {
    const { vtexAppKey, vtexAppToken } = this.settings ?? {}

    return {
      headers: {
        ...(vtexAppKey && { 'X-VTEX-API-AppKey': vtexAppKey }),
        ...(vtexAppToken && { 'X-VTEX-API-AppToken': vtexAppToken }),
      },
    }
  }

  private getUrl(path: string) {
    const url = `http://${this.settings?.account}.myvtex.com/${path}`

    // eslint-disable-next-line no-console
    console.log('======================================================')
    // eslint-disable-next-line no-console
    console.log('HttpClient Request:', url)
    // eslint-disable-next-line no-console
    console.log('======================================================')

    return url
  }

  public async get<T>(path: string): Promise<IOResponse<T>> {
    return this.http.getRaw(this.getUrl(path), this.getAuthHeaders())
  }
}
