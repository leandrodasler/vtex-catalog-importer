import type { QueryImportProgressArgs } from 'ssesandbox04.catalog-importer'

import { IMPORT_EXECUTION_FULL_FIELDS, STEPS_ENTITIES } from '../../helpers'

export const importProgress = async (
  _: unknown,
  { id }: QueryImportProgressArgs,
  context: Context
) => {
  const currentImport = await context.clients.importExecution.get(
    id,
    IMPORT_EXECUTION_FULL_FIELDS
  )

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
          { page: 1, pageSize: 1 },
          ['id'],
          '',
          `(executionImportId=${id}) AND (name=${entity})`
        )
        .then(({ pagination: { total } }) => total)
    )
  )

  return { currentImport, brands, categories, products, skus, prices, stocks }
}
