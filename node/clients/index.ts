import type { ClientsConfig } from '@vtex/api'
import { IOClients } from '@vtex/api'
import { masterDataFor, vbaseFor } from '@vtex/clients'
import type {
  ImportEntity,
  ImportExecution,
} from 'ssesandbox04.catalog-importer'

import {
  DEFAULT_CONCURRENCY,
  MAX_RETRIES,
  MD_ENTITIES,
  STABLE_MD_SCHEMA,
} from '../helpers'
import Cosmos from './Cosmos'
import HttpClient from './HttpClient'
import PrivateClient from './PrivateClient'
import SourceCatalog from './SourceCatalog'
import TargetCatalog from './TargetCatalog'

const { VTEX_APP_VENDOR, VTEX_APP_NAME } = process.env
const STABLE_SCHEMA_APP_ID = `${VTEX_APP_VENDOR}.${VTEX_APP_NAME}@${STABLE_MD_SCHEMA}`

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
      MD_ENTITIES.import,
      masterDataFor<ImportExecution>(MD_ENTITIES.import, STABLE_SCHEMA_APP_ID)
    )
  }

  public get importEntity() {
    return this.getOrSet(
      MD_ENTITIES.entity,
      masterDataFor<ImportEntity>(MD_ENTITIES.entity, STABLE_SCHEMA_APP_ID)
    )
  }

  public get mdSettings() {
    return this.getOrSet(
      'mdSettings',
      vbaseFor<string, MDSettings>('mdSettings')
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
      retries: MAX_RETRIES,
      timeout: 300000,
      concurrency: DEFAULT_CONCURRENCY,
    },
    events: {
      exponentialTimeoutCoefficient: 2,
      exponentialBackoffCoefficient: 2,
      initialBackoffDelay: 100,
      retries: 1,
      timeout: 300000,
      concurrency: DEFAULT_CONCURRENCY,
    },
  },
} as ClientsConfig<Clients>
