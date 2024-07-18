import { Service } from '@vtex/api'

import clients from './clients'
import events from './events'
import { pendingImportsTimer } from './helpers'
import graphql from './resolvers'

pendingImportsTimer()

export default new Service({ clients, graphql, events })
