import { convertCategory } from '../helpers/converters'

export const categories = async (
  _: unknown,
  __: unknown,
  { clients: { httpClient } }: Context
) => {
  const response = await httpClient.get<ApiCategory[]>(
    'api/catalog_system/pub/category/tree/1000'
  )

  return response.data.map(convertCategory)
}
