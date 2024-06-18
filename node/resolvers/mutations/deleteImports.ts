import type { MutationDeleteImportsArgs } from 'ssesandbox04.catalog-importer'

import { entityGetAll } from '../../helpers'

export const deleteImports = async (
  _: unknown,
  { ids }: MutationDeleteImportsArgs,
  context: Context
) => {
  const { importExecution } = context.clients
  const allImportIds =
    ids ?? (await entityGetAll(importExecution, ['id'])).map((i) => i.id)

  await Promise.all(allImportIds.map((id) => importExecution.delete(id)))

  return allImportIds
}
