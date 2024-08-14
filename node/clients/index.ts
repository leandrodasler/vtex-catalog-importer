import type { Cached, ClientsConfig } from '@vtex/api'
import { IOClients, LRUCache } from '@vtex/api'
import { masterDataFor } from '@vtex/clients'
import type {
  ImportEntity,
  ImportExecution,
} from 'ssesandbox04.catalog-importer'

import Cosmos from './Cosmos'
import HttpClient from './HttpClient'
import PrivateClient from './PrivateClient'
import SourceCatalog from './SourceCatalog'
import TargetCatalog from './TargetCatalog'

export class Clients extends IOClients {
  public get httpClient() {
    return this.getOrSet('httpClient', HttpClient)
  }

  public get sourceCatalog() {
    return this.getOrSet('sourceCatalog', SourceCatalog)
  }

  public get targetCatalog() {
    return this.getOrSet('targetCatalog', TargetCatalog)
  }

  public get cosmos() {
    return this.getOrSet('cosmos', Cosmos)
  }

  public get privateClient() {
    return this.getOrSet('privateClient', PrivateClient)
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
const CONCURRENCY = 1

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
