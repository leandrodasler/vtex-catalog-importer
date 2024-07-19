import type { QueryGetEntitiesArgs } from 'ssesandbox04.catalog-importer'

import { entityGetAll, entityMapper, IMPORT_ENTITY_FIELDS } from '../../helpers'

export const getEntities = async (
  _: unknown,
  { importId, entityName }: QueryGetEntitiesArgs,
  context: Context
) => {
  const data = await entityGetAll(context.clients.importEntity, {
    fields: IMPORT_ENTITY_FIELDS,
    where: `(executionImportId=${importId})AND(name=${entityName})`,
  })

  return data.map(entityMapper)
}
