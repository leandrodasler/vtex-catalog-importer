import type { MutationDeleteImportArgs } from 'ssesandbox04.catalog-importer'

import { setCachedContext, setImportToBeDeleted } from '../../helpers'

export const deleteImport = async (
  _: unknown,
  { id }: MutationDeleteImportArgs,
  context: Context
) => {
  setCachedContext(context)
  const { importExecution } = context.clients

  if (!id) return

  const importData = await importExecution.get(id, ['status'])

  if (importData.status === 'RUNNING') {
    throw new Error('admin/import.delete.notAllowed')
  }

  setImportToBeDeleted(id)

  return id
}
