import type { MutationDeleteImportsArgs } from 'ssesandbox04.catalog-importer'

import {
  batch,
  entityGetAll,
  setCachedContext,
  setImportToBeDeleted,
} from '../../helpers'

export const deleteImports = async (
  _: unknown,
  { ids }: MutationDeleteImportsArgs,
  context: Context
) => {
  setCachedContext(context)
  const { importExecution } = context.clients

  if (!ids.length) {
    return []
  }

  batch(ids, (id) =>
    id === '*'
      ? entityGetAll(importExecution, { fields: ['id'] }).then((data) =>
          batch(data, ({ id: importId }) => setImportToBeDeleted(importId))
        )
      : setImportToBeDeleted(id)
  )

  return ids
}
