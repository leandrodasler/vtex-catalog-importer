// import type { QueryCategoriesArgs } from 'ssesandbox04.catalog-importer'

import { convertCategory } from '../helpers/converters'

export const categories = async (
  _: unknown,
  __: unknown, // { settings }: QueryCategoriesArgs,
  { clients: { httpClient } }: Context
) => {
  // eslint-disable-next-line no-console
  console.log(
    'categories resolver\n============================================================'
  )

  const response = await httpClient.get<ApiCategory[]>(
    'api/catalog_system/pub/category/tree/1000'
  )

  return response.data.map(convertCategory)
}
