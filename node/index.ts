import type {
  Cached,
  ClientsConfig,
  RecorderState,
  ServiceContext,
} from '@vtex/api'
import { LRUCache, Service } from '@vtex/api'
import type { AppSettingsInput } from 'ssesandbox04.catalog-importer'

import { Clients } from './clients'
import { WithSettings } from './directives/WithSettings'
import { appSettings } from './resolvers/appSettings'
import { brands } from './resolvers/brands'
import { categories } from './resolvers/categories'
import { updateAppSettings } from './resolvers/updateAppSettings'

const TIMEOUT_MS = 5 * 60 * 1000
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
  interface State extends RecorderState {
    body: {
      settings?: AppSettingsInput
    }
  }

  type Context = ServiceContext<Clients, State>
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
      Mutation: {
        updateAppSettings,
      },
    },
    schemaDirectives: {
      WithSettings,
    },
  },
})
