import { NotFoundError } from '@vtex/api'
import type {
  ImportExecution,
  QueryImportProgressArgs,
} from 'ssesandbox04.catalog-importer'

import {
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

  const { importExecution, importEntity } = context.clients
  const currentImport: ImportExecution = await importExecution.get(
    id,
    IMPORT_EXECUTION_FULL_FIELDS
  )

  if (!currentImport) {
    throw new NotFoundError('import-not-found')
  }

  const [categories, products, skus, prices, stocks] = await Promise.all(
    STEPS_ENTITIES.map((entity) =>
      importEntity
        .searchRaw(
          ONE_RESULT,
          ['id'],
          '',
          `(executionImportId=${id})AND(name=${entity})`
        )
        .then(({ pagination: { total } }) => total)
    )
  )

  const sourceCategoriesTotal = currentImport.sourceCategoriesTotal ?? 0
  const sourceProductsTotal = currentImport.sourceProductsTotal ?? 0
  const sourceSkusTotal = currentImport.sourceSkusTotal ?? 0
  const sourcePricesTotal = currentImport.sourcePricesTotal ?? 0
  const sourceStocksTotal = currentImport.sourceStocksTotal ?? 0
  const { status } = currentImport
  const completed =
    status === IMPORT_STATUS.ERROR ||
    (categories >= sourceCategoriesTotal &&
      products >= sourceProductsTotal &&
      skus >= sourceSkusTotal &&
      prices >= sourcePricesTotal &&
      stocks >= sourceStocksTotal)

  return {
    currentImport: {
      ...currentImport,
      sourceCategoriesTotal,
      sourceProductsTotal,
      sourceSkusTotal,
      sourcePricesTotal,
      sourceStocksTotal,
    },
    categories,
    products,
    skus,
    prices,
    stocks,
    completed,
    status,
  }
}
