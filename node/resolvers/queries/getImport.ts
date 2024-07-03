import type { QueryGetImportArgs } from 'ssesandbox04.catalog-importer'

import { IMPORT_EXECUTION_FULL_FIELDS } from '../../helpers'

export const getImport = async (
  _: unknown,
  { id }: QueryGetImportArgs,
  context: Context
) => context.clients.importExecution.get(id, IMPORT_EXECUTION_FULL_FIELDS)
