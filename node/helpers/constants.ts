import type { ImportStatus } from 'ssesandbox04.catalog-importer'

import handleBrands from '../events/steps/01-brands'
import handleCategories from '../events/steps/02-categories'
import handleProducts from '../events/steps/03-products'
import handleSkus from '../events/steps/04-skus'
import handlePrices from '../events/steps/05-prices'
import handleStocks from '../events/steps/06-stocks'

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
  'sourceCategoriesTotal',
  'sourceProductsTotal',
  'sourceSkusTotal',
  'sourcePricesTotal',
  'sourceStocksTotal',
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

const MAP_ENTITY_STEP_HANDLER = {
  brand: handleBrands,
  category: handleCategories,
  product: handleProducts,
  sku: handleSkus,
  price: handlePrices,
  stock: handleStocks,
}

export const STEPS_ENTITIES = Object.keys(MAP_ENTITY_STEP_HANDLER)
export const STEPS_HANDLERS = Object.values(MAP_ENTITY_STEP_HANDLER)
