import type { Cached, ClientsConfig } from '@vtex/api'
import { IOClients, LRUCache } from '@vtex/api'
import { masterDataFor } from '@vtex/clients'
import type {
  ImportEntity,
  ImportExecution,
} from 'ssesandbox04.catalog-importer'

import Catalog from './Catalog'
import HttpClient from './HttpClient'
import VtexId from './VtexId'

export class Clients extends IOClients {
  public get httpClient() {
    return this.getOrSet('httpClient', HttpClient)
  }

  public get catalog() {
    return this.getOrSet('catalog', Catalog)
  }

  public get vtexId() {
    return this.getOrSet('vtexId', VtexId)
  }

  public get importExecution() {
    return this.getOrSet(
      'importExecution',
      masterDataFor<ImportExecution>('importExecution')
    )
  }

  public get importEntity() {
    return this.getOrSet(
      'importEntity',
      masterDataFor<ImportEntity>('importEntity')
    )
  }
}

const memoryCache = new LRUCache<string, Cached>({ max: 5000 })
const CONCURRENCY = 10

export default {
  implementation: Clients,
  options: {
    default: {
      exponentialTimeoutCoefficient: 2,
      exponentialBackoffCoefficient: 2,
      initialBackoffDelay: 100,
      retries: 10,
      timeout: 3000,
      concurrency: CONCURRENCY,
      memoryCache,
      asyncSetCache: true,
    },
    events: {
      retries: 0,
      timeout: 300000,
      concurrency: 1,
    },
  },
} as ClientsConfig<Clients>
