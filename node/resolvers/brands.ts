import type { Brand } from 'ssesandbox04.catalog-importer'

export const brands = async (
  _: unknown,
  __: unknown,
  { clients: { httpClient } }: Context
) => {
  // eslint-disable-next-line no-console
  console.log(
    'brands resolver\n============================================================'
  )

  const response = await httpClient.get<Brand[]>(
    'api/catalog_system/pvt/brand/list'
  )

  return response.data
}
