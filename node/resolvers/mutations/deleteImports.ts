import type { MutationDeleteImportsArgs } from 'ssesandbox04.catalog-importer'

import { entityGetAll } from '../../helpers'

export const deleteImports = async (
  _: unknown,
  { ids }: MutationDeleteImportsArgs,
  context: Context
) => {
  const { importExecution, importEntity } = context.clients

  if (!ids.length) {
    return []
  }

  await Promise.all(ids.map((id) => importExecution.delete(id)))

  const importEntities = await entityGetAll(importEntity, {
    fields: ['id'],
    where: ids.map((id) => `(executionImportId=${id})`).join(' OR '),
  })

  if (importEntities.length) {
    await Promise.all(importEntities.map(({ id }) => importEntity.delete(id)))
  }

  return ids
}
