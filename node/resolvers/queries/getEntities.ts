import type { QueryGetEntitiesArgs } from 'ssesandbox04.catalog-importer'

import { entityGetAll, entityMapper, IMPORT_ENTITY_FIELDS } from '../../helpers'

export const getEntities = async (
  _: unknown,
  { executionImportId, name }: QueryGetEntitiesArgs,
  context: Context
) => {
  const data = await entityGetAll(context.clients.importEntity, {
    fields: IMPORT_ENTITY_FIELDS,
    where: `(executionImportId=${executionImportId})AND(name=${name})`,
  })

  return data.map(entityMapper)
}
