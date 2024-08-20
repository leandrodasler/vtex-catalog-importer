import type { ClientsConfig } from '@vtex/api'
import { IOClients } from '@vtex/api'
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

const STABLE_SCHEMA_VERSION = '0.0.11'
const { VTEX_APP_VENDOR, VTEX_APP_NAME } = process.env
const STABLE_SCHEMA_APP_ID = `${VTEX_APP_VENDOR}.${VTEX_APP_NAME}@${STABLE_SCHEMA_VERSION}`

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
      masterDataFor<ImportExecution>('importExecution', STABLE_SCHEMA_APP_ID)
    )
  }

  public get importEntity() {
    return this.getOrSet(
      'importEntity',
      masterDataFor<ImportEntity>('importEntity', STABLE_SCHEMA_APP_ID)
    )
  }
}

export default {
  implementation: Clients,
  options: {
    default: {
      exponentialTimeoutCoefficient: 2,
      exponentialBackoffCoefficient: 2,
      initialBackoffDelay: 100,
      retries: 10,
      timeout: 3000,
      concurrency: 1,
    },
  },
} as ClientsConfig<Clients>
