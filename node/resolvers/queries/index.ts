import type {
  QueryImportsArgs,
  Query as ResolverQuery,
} from 'ssesandbox04.catalog-importer'

import {
  ENDPOINTS,
  IMPORT_EXECUTION_FIELDS,
  httpGetResolverFactory,
} from '../../helpers'

const appSettings = async (_: unknown, __: unknown, context: Context) =>
  context.state.settings

const categories = httpGetResolverFactory<ResolverQuery['categories']>(
  ENDPOINTS.categories
)

export const imports = async (
  _: unknown,
  { args }: QueryImportsArgs,
  context: Context
) => {
  const page = args.page ?? 1
  const pageSize = args.pageSize ?? 100
  const sort = args.sort ?? 'createdIn desc'
  const where = args.where ?? ''

  const data = await context.clients.importExecution.searchRaw(
    { page, pageSize },
    IMPORT_EXECUTION_FIELDS,
    sort,
    where
  )

  return data
}

export default { appSettings, categories, imports }
