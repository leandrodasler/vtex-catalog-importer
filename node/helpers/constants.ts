import type { ImportStatus } from 'ssesandbox04.catalog-importer'

import handleBrands from '../events/steps/01-brands'
import handleCategories from '../events/steps/02-categories'
import handleProducts from '../events/steps/03-products'
import handleSkus from '../events/steps/04-skus'
import handlePrices from '../events/steps/05-prices'
import handleStocks from '../events/steps/06-stocks'
import finishImport from '../events/steps/07-finishImport'

export const ENDPOINTS = {
  host: 'vtexcommercestable.com.br',
  defaultSettings:
    'http://ssesandbox04.myvtex.com/catalog-importer-configuration/settings',
  getUser: '/api/vtexid/credential/validate',
  categories: 'api/catalog_system/pub/category/tree/1000',
  brands: {
    get: 'api/catalog_system/pvt/brand/list',
    set: 'api/catalog/pvt/brand',
    updateOrDetails: (id: string | number) => `api/catalog/pvt/brand/${id}`,
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
  'sourceCategoriesTotal',
  'sourceProductsTotal',
  'sourceSkusTotal',
  'sourcePricesTotal',
  'sourceStocksTotal',
  'status',
  'error',
  'entityError',
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

export const IMPORT_STATUS: { [keyof in ImportStatus]: ImportStatus } = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  TO_BE_DELETED: 'TO_BE_DELETED',
  DELETING: 'DELETING',
}

export const ONE_RESULT = { page: 1, pageSize: 1 }
export const COMMON_WHERE = `(status<>${IMPORT_STATUS.TO_BE_DELETED})AND(status<>${IMPORT_STATUS.DELETING})`

export const STEPS = [
  { entity: 'brand', handler: handleBrands },
  { entity: 'category', handler: handleCategories },
  { entity: 'product', handler: handleProducts },
  { entity: 'sku', handler: handleSkus },
  { entity: 'price', handler: handlePrices },
  { entity: 'stock', handler: handleStocks },
  { handler: finishImport },
]

export const STEPS_ENTITIES = STEPS.filter(({ entity }) => entity).map(
  ({ entity }) => entity
) as string[]

export const STEPS_HANDLERS = STEPS.map(({ handler }) => handler)
