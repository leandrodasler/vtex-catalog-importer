import type { IOContext, IOResponse, InstanceOptions } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

export default class HttpClient extends ExternalClient {
  private settings?: Settings

  constructor(context: IOContext, options?: InstanceOptions) {
    super('', context, {
      ...options,
      headers: {
        ...options?.headers,
        VtexIdclientAutcookie: context.adminUserAuthToken as string,
      },
    })
  }

  public setSettings(settings: Settings) {
    this.settings = settings
  }

  private getAuthHeaders() {
    return {
      headers: {
        'X-VTEX-API-AppKey': this.settings?.vtexAppKey,
        'X-VTEX-API-AppToken': this.settings?.vtexAppToken,
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
