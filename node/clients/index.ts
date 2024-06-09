import type { Cached, ClientsConfig } from '@vtex/api'
import { IOClients, LRUCache } from '@vtex/api'

import HttpClient from './HttpClient'

export class Clients extends IOClients {
  public get httpClient() {
    return this.getOrSet('httpClient', HttpClient)
  }
}

const memoryCache = new LRUCache<string, Cached>({ max: 5000 })

export const clients: ClientsConfig<Clients> = {
  implementation: Clients,
  options: {
    default: {
      exponentialTimeoutCoefficient: 2,
      exponentialBackoffCoefficient: 2,
      initialBackoffDelay: 100,
      retries: 10,
      timeout: 3000,
      concurrency: 10,
      memoryCache,
    },
  },
}
