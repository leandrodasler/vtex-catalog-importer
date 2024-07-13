import type { ImportStatus } from 'ssesandbox04.catalog-importer'

export const ENDPOINTS = {
  defaultSettings:
    'http://ssesandbox04.myvtex.com/catalog-importer-configuration/settings',
  getUser: '/api/vtexid/credential/validate',
  categories: 'api/catalog_system/pub/category/tree/1000',
  brands: {
    get: 'api/catalog_system/pvt/brand/list',
    set: 'api/catalog/pvt/brand',
  },
}

export const IMPORT_EXECUTION_FIELDS = [
  'id',
  'createdIn',
  'lastInteractionIn',
  'user',
  'settings',
  'importImages',
  'importPrices',
  'stocksOption',
  'stockValue',
  'sourceBrandsTotal',
  'status',
  'error',
]

export const IMPORT_EXECUTION_FULL_FIELDS = [
  ...IMPORT_EXECUTION_FIELDS,
  'categoryTree',
]

export const IMPORT_ENTITY_FIELDS = [
  'id',
  'createdIn',
  'lastInteractionIn',
  'name',
  'executionImportId',
  'sourceAccount',
  'sourceId',
  'targetId',
  'pathParams',
  'payload',
]

export const IMPORT_STATUS: { [key in ImportStatus]: ImportStatus } = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
}

export const STEPS_ENTITIES = [
  'brand',
  'category',
  'product',
  'sku',
  'price',
  'stock',
]
