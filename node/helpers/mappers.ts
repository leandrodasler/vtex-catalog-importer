import type { Brand } from '@vtex/clients'
import type { Entity, ImportEntity } from 'ssesandbox04.catalog-importer'

export const entityMapper = ({
  id,
  createdIn,
  lastInteractionIn,
  executionImportId,
  name,
  sourceAccount,
  sourceId,
  targetId,
  pathParams,
  payload,
}: WithInternalFields<ImportEntity>) => {
  return {
    id,
    name,
    sourceAccount,
    sourceId,
    targetId,
    createdIn,
    lastInteractionIn,
    importId: executionImportId,
    pathParams: JSON.stringify(pathParams),
    payload: JSON.stringify(payload),
  } as Entity
}

export const brandMapper = (brand: Brand) => ({
  Id: brand.id,
  Name: brand.name,
  Text: (brand.metaTagDescription?.trim() ?? '') || brand.name,
  Active: brand.isActive,
})
