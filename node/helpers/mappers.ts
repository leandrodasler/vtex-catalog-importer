import type { ImportEntity } from 'ssesandbox04.catalog-importer'

export const entityMapper = (entity: WithInternalFields<ImportEntity>) => ({
  ...entity,
  payload: JSON.stringify(entity.payload),
})
