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
  Import,
  ImportEntity,
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

  public get importEntity() {
    return this.getOrSet(
      'importEntity',
      masterDataFor<ImportEntity>('importEntity')
    )
  }
}

declare global {
  type WithInternalFields<T> = T & {
    id: string
    createdIn: string
    lastInteractionIn: string
  }

  type ProcessImport = WithInternalFields<Import>
  type ServiceState = RecorderState & { settings?: AppSettingsInput }
  type Context = ServiceContext<Clients, ServiceState>
  type EventState = { body: Partial<ProcessImport> }
  type AppEventContext = EventContext<Clients, EventState>
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
      timeout: 60000,
      concurrency: 10,
    },
  },
} as ClientsConfig<Clients>
