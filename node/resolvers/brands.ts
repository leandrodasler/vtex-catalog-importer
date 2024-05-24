import type { Brand } from 'ssesandbox04.catalog-importer'

export const brands = async (
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
  const response = await httpClient.get<Brand[]>(
    'api/catalog_system/pvt/brand/list'
  )

  return response.data
}
