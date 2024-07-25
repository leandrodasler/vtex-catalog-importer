import type {
  ImportExecution,
  QueryImportProgressArgs,
} from 'ssesandbox04.catalog-importer'

import {
  IMPORT_EXECUTION_FULL_FIELDS,
  ONE_RESULT,
  STEPS_ENTITIES,
} from '../../helpers'

export const importProgress = async (
  _: unknown,
  { id }: QueryImportProgressArgs,
  context: Context
) => {
  const currentImport = (await context.clients.importExecution.get(
    id,
    IMPORT_EXECUTION_FULL_FIELDS
  )) as ImportExecution

  const [
    brands,
    categories,
    products,
    skus,
    prices,
    stocks,
  ] = await Promise.all(
    STEPS_ENTITIES.map((entity) =>
      context.clients.importEntity
        .searchRaw(
          ONE_RESULT,
          ['id'],
          '',
          `(executionImportId=${id})AND(name=${entity})`
        )
        .then(({ pagination: { total } }) => total)
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
    brands >= sourceBrandsTotal &&
    categories >= sourceCategoriesTotal &&
    products >= sourceProductsTotal &&
    skus >= sourceSkusTotal &&
    prices >= sourcePricesTotal &&
    stocks >= sourceStocksTotal

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
