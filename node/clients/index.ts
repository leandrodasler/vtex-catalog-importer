import type {
  Cached,
  ClientsConfig,
  EventContext,
  RecorderState,
  ServiceContext,
} from '@vtex/api'
import { IOClients, LRUCache } from '@vtex/api'
import { masterDataFor } from '@vtex/clients'
import type {
  AppSettingsInput,
  ImportExecution,
} from 'ssesandbox04.catalog-importer'

import HttpClient from './HttpClient'
import VtexId from './VtexId'

class Clients extends IOClients {
  public get httpClient() {
    return this.getOrSet('httpClient', HttpClient)
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
}

declare global {
  type State = RecorderState & {
    body: {
      settings?: AppSettingsInput
      importId?: string
    }
  }

  type WithInternalFields<T> = T & {
    id: string
    createdIn: Date
    lastInteractionIn: Date
  }

  type Context = ServiceContext<Clients, State>
  type AppEventContext = EventContext<Clients, State>
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
      asyncSetCache: true,
    },
    events: {
      exponentialTimeoutCoefficient: 2,
      exponentialBackoffCoefficient: 2,
      initialBackoffDelay: 50,
      retries: 1,
      timeout: 3000,
      concurrency: 10,
    },
  },
} as ClientsConfig<Clients>
