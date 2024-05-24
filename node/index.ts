import type {
  Cached,
  ClientsConfig,
  RecorderState,
  ServiceContext,
} from '@vtex/api'
import { LRUCache, Service } from '@vtex/api'

import { Clients } from './clients'
import { WithSettings } from './directives/WithSettings'
import { appSettings } from './resolvers/appSettings'
import { brands } from './resolvers/brands'
import { categories } from './resolvers/categories'

const TIMEOUT_MS = 4 * 1000
const CONCURRENCY = 10
const memoryCache = new LRUCache<string, Cached>({ max: 5000 })

const clients: ClientsConfig<Clients> = {
  implementation: Clients,
  options: {
    default: {
      exponentialTimeoutCoefficient: 2,
      exponentialBackoffCoefficient: 2,
      initialBackoffDelay: 100,
      retries: 10,
      timeout: TIMEOUT_MS,
      concurrency: CONCURRENCY,
      memoryCache,
    },
  },
}

declare global {
  interface Settings {
    account: string
    vtexAppKey: string
    vtexAppToken: string
  }

  interface State extends RecorderState {
    body: {
      settings: Settings
    }
  }

  interface ApiCategory {
    id: number
    name: string
    children?: ApiCategory[]
  }

  type Context = ServiceContext<Clients, State>

  type Next = () => Promise<void>
}

export default new Service({
  clients,
  graphql: {
    resolvers: {
      Query: {
        appSettings,
        categories,
        brands,
      },
    },
    schemaDirectives: {
      WithSettings,
    },
  },
})
