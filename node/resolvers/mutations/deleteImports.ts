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

  entityGetAll(importEntity, {
    fields: ['id'],
    where: ids.map((id) => `(executionImportId=${id})`).join(' OR '),
  }).then((data) => batch(data, ({ id }) => importEntity.delete(id)))

  return ids
}
