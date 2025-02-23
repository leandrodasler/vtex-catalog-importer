import type { QueryImportsArgs } from 'ssesandbox04.catalog-importer'

import { IMPORT_EXECUTION_FIELDS, setCachedContext } from '../../helpers'

export const imports = async (
  _: unknown,
  { args }: QueryImportsArgs,
  context: Context
) => {
  setCachedContext(context)
  const page = args.page ?? 1
  const pageSize = args.pageSize ?? 100
  const sort = args.sort ?? 'createdIn desc'
  const where = `${args.where ? `(${args.where})AND` : ''}`

  const data = await context.clients.importExecution.searchRaw(
    { page, pageSize },
    IMPORT_EXECUTION_FIELDS,
    sort,
    where
  )

  return data
}
