import type { Query } from 'ssesandbox04.catalog-importer'

export const categories = async (_: unknown, __: unknown, context: Context) => {
  const response = await context.clients.httpClient.get<Query['categories']>(
    'api/catalog_system/pub/category/tree/1000'
  )

  return response.data
}
