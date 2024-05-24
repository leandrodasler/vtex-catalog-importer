import type { Category } from 'ssesandbox04.catalog-importer'

interface ApiCategory {
  id: number
  name: string
  children?: ApiCategory[]
}

const convertCategory = (c: ApiCategory): Partial<Category> =>
  ({
    id: String(c.id),
    name: c.name,
    ...(c.children?.length && {
      subCategories: c.children.map(convertCategory),
    }),
  } as Partial<Category>)

export const categories = async (
  _: unknown,
  __: unknown,
  { clients: { apps, httpClient } }: Context
) => {
  const {
    account = '',
    vtexAppKey = '',
    vtexAppToken = '',
  } = (await apps.getAppSettings(process.env.VTEX_APP_ID as string)) as Settings

  if (!account || !vtexAppKey || !vtexAppToken) {
    throw new Error('admin/settings.missing.error')
  }

  httpClient.setSettings({ account, vtexAppKey, vtexAppToken })
  const response = await httpClient.get<ApiCategory[]>(
    'api/catalog_system/pub/category/tree/1000'
  )

  return response.data.map(convertCategory)
}
