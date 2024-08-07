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
  user: '/api/vtexid/credential/validate',
  brand: {
    list: '/api/catalog_system/pvt/brand/list',
    set: '/api/catalog/pvt/brand',
    updateOrDetails: (id: ID) => `/api/catalog/pvt/brand/${id}`,
  },
  category: {
    list: '/api/catalog_system/pub/category/tree/1000',
    set: '/api/catalog/pvt/category',
    updateOrDetails: (id: ID) => `/api/catalog/pvt/category/${id}`,
  },
  specification: {
    listByProduct: (productId: ID) =>
      `/api/catalog_system/pvt/products/${productId}/specification`,
    get: (specificationId: ID) =>
      `/api/catalog/pvt/specification/${specificationId}`,
    getGroup: (groupId: ID) =>
      `/api/catalog_system/pub/specification/groupGet/${groupId}`,
  },
  product: {
    /* remove this after */
    listAll: (from: number, to: number) =>
      `/api/catalog_system/pvt/products/GetProductAndSkuIds?_from=${from}&_to=${to}`,
    listByCategory: (categoryId: ID, from: number, to: number) =>
      `/api/catalog_system/pvt/products/GetProductAndSkuIds?categoryId=${categoryId}&_from=${from}&_to=${to}`,
    set: '/api/catalog/pvt/product',
    updateOrDetails: (id: ID) => `/api/catalog/pvt/product/${id}`,
    setSpecification: (productId: ID) =>
      `/api/catalog/pvt/product/${productId}/specificationvalue`,
  },
  sku: {
    set: '/api/catalog/pvt/stockkeepingunit',
    getContext: (skuId: ID) =>
      `/api/catalog_system/pvt/sku/stockkeepingunitbyid/${skuId}`,
    updateOrDetails: (id: ID) => `/api/catalog/pvt/stockkeepingunit/${id}`,
    setEan: (skuId: ID, ean: string) =>
      `/api/catalog/pvt/stockkeepingunit/${skuId}/ean/${ean}`,
    setSpecification: (skuId: ID) =>
      `/api/catalog/pvt/stockkeepingunit/${skuId}/specificationvalue`,
    listOrSetFile: (skuId: ID) =>
      `/api/catalog/pvt/stockkeepingunit/${skuId}/file`,
  },
  stock: {
    listWarehouses: '/api/logistics/pvt/configuration/warehouses',
  },
}

const INTERNAL_FIELDS = ['id', 'createdIn', 'lastInteractionIn']

export const IMPORT_EXECUTION_FIELDS = [
  ...INTERNAL_FIELDS,
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
  ...INTERNAL_FIELDS,
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

export const STEP_DELAY = 1000
export const CATEGORY_DELAY = 500
export const DEFAULT_BATCH_CONCURRENCY = 500
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
