import type { Query as ResolverQuery } from 'ssesandbox04.catalog-importer'

import { ENDPOINTS, httpGetResolverFactory } from '../helpers'
import { brands } from './brands'
import { clearImports } from './clearImports'
import { executeImport } from './executeImport'
import { updateAppSettings } from './updateAppSettings'

const appSettings = async (_: unknown, __: unknown, context: Context) =>
  context.state.body.settings

const categories = httpGetResolverFactory<ResolverQuery['categories']>(
  ENDPOINTS.categories
)

export default {
  Query: {
    appSettings,
    categories,
    brands,
  },
  Mutation: {
    updateAppSettings,
    executeImport,
    clearImports,
  },
}
