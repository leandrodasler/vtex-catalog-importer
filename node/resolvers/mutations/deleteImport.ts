import type { MutationDeleteImportArgs } from 'ssesandbox04.catalog-importer'

import {
  deleteImportFiles,
  IMPORT_STATUS,
  setCachedContext,
  updateImportStatus,
} from '../../helpers'

export const deleteImport = async (
  _: unknown,
  { id }: MutationDeleteImportArgs,
  context: Context
) => {
  setCachedContext(context)

  if (!id) return

  deleteImportFiles(id)
  updateImportStatus(context, id, IMPORT_STATUS.TO_BE_DELETED)

  return id
}
