import type { RecorderState, ServiceContext } from '@vtex/api'
import { Service } from '@vtex/api'
import type { AppSettingsInput } from 'ssesandbox04.catalog-importer'

import type { Clients } from './clients'
import clients from './clients'
import schemaDirectives from './directives'
import resolvers from './resolvers'

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
    resolvers,
    schemaDirectives,
  },
})
