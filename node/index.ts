import { Service } from '@vtex/api'

import clients from './clients'
import schemaDirectives from './directives'
import events from './events'
import resolvers from './resolvers'

export default new Service({
  clients,
  graphql: {
    resolvers,
    schemaDirectives,
  },
  events,
})
