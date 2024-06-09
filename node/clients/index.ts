import type {
  Cached,
  ClientsConfig,
  RecorderState,
  ServiceContext,
} from '@vtex/api'
import { IOClients, LRUCache } from '@vtex/api'
import type { AppSettingsInput } from 'ssesandbox04.catalog-importer'

import HttpClient from './HttpClient'

class Clients extends IOClients {
  public get httpClient() {
    return this.getOrSet('httpClient', HttpClient)
  }
}

declare global {
  interface State extends RecorderState {
    body: {
      settings?: AppSettingsInput
    }
  }

  type Context = ServiceContext<Clients, State>
}

const memoryCache = new LRUCache<string, Cached>({ max: 5000 })

export default {
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
} as ClientsConfig<Clients>
