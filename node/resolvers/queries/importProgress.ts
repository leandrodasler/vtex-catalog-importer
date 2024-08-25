import type {
  ImportExecution,
  QueryImportProgressArgs,
} from 'ssesandbox04.catalog-importer'

import {
  DEFAULT_VBASE_BUCKET,
  IMPORT_EXECUTION_FULL_FIELDS,
  IMPORT_STATUS,
  ONE_RESULT,
  setCachedContext,
  STEPS_ENTITIES,
} from '../../helpers'

export const importProgress = async (
  _: unknown,
  { id }: QueryImportProgressArgs,
  context: Context
) => {
  setCachedContext(context)

  const { importExecution, importEntity, vbase } = context.clients
  const currentImport: ImportExecution = await importExecution.get(
    id,
    IMPORT_EXECUTION_FULL_FIELDS
  )

  const vbaseJson = await vbase
    .getJSON<VBaseJSON>(DEFAULT_VBASE_BUCKET, id, true)
    .catch(() => null)

  const [
    brands,
    categories,
    products,
    skus,
    prices,
    stocks,
  ] = await Promise.all(
    STEPS_ENTITIES.map((entity) =>
      importEntity
        .searchRaw(
          ONE_RESULT,
          ['id'],
          '',
          `(executionImportId=${id})AND(name=${entity})`
        )
        .then(({ pagination: { total } }) => total + (vbaseJson?.[entity] ?? 0))
    )
  )

  const sourceBrandsTotal = currentImport.sourceBrandsTotal ?? 0
  const sourceCategoriesTotal = currentImport.sourceCategoriesTotal ?? 0
  const sourceProductsTotal = currentImport.sourceProductsTotal ?? 0
  const sourceSkusTotal = currentImport.sourceSkusTotal ?? 0
  const sourcePricesTotal = currentImport.sourcePricesTotal ?? 0
  const sourceStocksTotal = currentImport.sourceStocksTotal ?? 0
  const { status } = currentImport
  const completed =
    status === IMPORT_STATUS.ERROR ||
    (brands >= sourceBrandsTotal &&
      categories >= sourceCategoriesTotal &&
      products >= sourceProductsTotal &&
      skus >= sourceSkusTotal &&
      prices >= sourcePricesTotal &&
      stocks >= sourceStocksTotal)

  return {
    currentImport: {
      ...currentImport,
      sourceBrandsTotal,
      sourceCategoriesTotal,
      sourceProductsTotal,
      sourceSkusTotal,
      sourcePricesTotal,
      sourceStocksTotal,
    },
    brands,
    categories,
    products,
    skus,
    prices,
    stocks,
    completed,
    status,
  }
}
