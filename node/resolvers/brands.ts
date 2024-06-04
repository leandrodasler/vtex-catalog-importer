import type { Query } from 'ssesandbox04.catalog-importer'

export const brands = async (_: unknown, __: unknown, context: Context) => {
  const response = await context.clients.httpClient.get<Query['brands']>(
    'api/catalog_system/pvt/brand/list'
  )

  return response.data
}
