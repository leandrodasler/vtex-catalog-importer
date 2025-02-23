import type { MutationDeleteImportArgs } from 'ssesandbox04.catalog-importer'

import {
  DEFAULT_VBASE_BUCKET,
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

  context.clients.vbase.deleteFile(DEFAULT_VBASE_BUCKET, id).catch(() => {})
  deleteImportFiles(id)
  updateImportStatus(context, id, IMPORT_STATUS.TO_BE_DELETED)

  return id
}
