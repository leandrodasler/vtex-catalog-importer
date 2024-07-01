import schemaDirectives from './directives'
import Mutation from './mutations'
import Query from './queries'

export default {
  resolvers: { Query, Mutation },
  schemaDirectives,
}
