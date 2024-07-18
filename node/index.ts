import { Service } from '@vtex/api'

import clients from './clients'
import events from './events'
import { timers } from './helpers'
import graphql from './resolvers'

timers()

export default new Service({ clients, graphql, events })
