import type { InstanceOptions } from '@vtex/api'

import HttpClient from './HttpClient'

export default class Cosmos extends HttpClient {
  protected getRequestConfig(): InstanceOptions {
    return {
      headers: {
        'User-Agent': 'Cosmos-API-Request',
        'X-Cosmos-Token': '{{token}}',
      },
    }
  }

  protected getUrl(path: string) {
    return `http://api.cosmos.bluesoft.com.br${path}`
  }

  public getProductsByGpc(gpc: string) {
    return this.get(`/gpcs/${gpc}`)
  }
}
