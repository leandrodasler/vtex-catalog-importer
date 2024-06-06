import type { IOContext, IOResponse, InstanceOptions } from '@vtex/api'
import { ExternalClient } from '@vtex/api'
import type { AppSettingsInput } from 'ssesandbox04.catalog-importer'

export default class HttpClient extends ExternalClient {
  protected settings?: AppSettingsInput

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

  protected getAuthHeaders() {
    const { vtexAppKey, vtexAppToken } = this.settings ?? {}

    return {
      headers: {
        ...(vtexAppKey && { 'X-VTEX-API-AppKey': vtexAppKey }),
        ...(vtexAppToken && { 'X-VTEX-API-AppToken': vtexAppToken }),
      },
    }
  }

  protected getUrl(path: string) {
    return `http://${this.settings?.account}.myvtex.com/${path}`
  }

  public async get<T>(path: string): Promise<IOResponse<T>> {
    const url = this.getUrl(path)
    const options = this.getAuthHeaders()

    // eslint-disable-next-line no-console
    console.log('======================================================')
    // eslint-disable-next-line no-console
    console.log('HttpClient GET:', { url, options })
    // eslint-disable-next-line no-console
    console.log('======================================================')

    return this.http.getRaw(url, options)
  }
}
