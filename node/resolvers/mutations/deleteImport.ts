import type { MutationDeleteImportArgs } from 'ssesandbox04.catalog-importer'

import {
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

  const importData = await context.clients.importExecution.get(id, ['status'])

  if (importData.status === IMPORT_STATUS.RUNNING) {
    throw new Error('admin/import.delete.notAllowed')
  }

  updateImportStatus(context, id, IMPORT_STATUS.TO_BE_DELETED)

  return id
}
