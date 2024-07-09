import type { MutationDeleteImportsArgs } from 'ssesandbox04.catalog-importer'

import { batch, entityGetAll } from '../../helpers'

export const deleteImports = async (
  _: unknown,
  { ids }: MutationDeleteImportsArgs,
  context: Context
) => {
  const { importExecution, importEntity } = context.clients

  if (!ids.length) {
    return []
  }

  batch(ids, (id) => importExecution.delete(id))

  const importEntities = await entityGetAll(importEntity, {
    fields: ['id'],
    where: ids.map((id) => `(executionImportId=${id})`).join(' OR '),
  })

  if (importEntities.length) {
    batch(importEntities, ({ id }) => importEntity.delete(id))
  }

  return ids
}
