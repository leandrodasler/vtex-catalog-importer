import type { AppSettingsInput } from 'ssesandbox04.catalog-importer'

export const ENDPOINTS = {
  defaultSettings:
    'http://ssesandbox04.myvtex.com/catalog-importer-configuration/settings',
  categories: 'api/catalog_system/pub/category/tree/1000',
}

export const getCurrentSettings = async ({ clients: { apps } }: Context) =>
  apps.getAppSettings(process.env.VTEX_APP_ID as string) as AppSettingsInput

export const getDefaultSettings = async ({
  clients: { httpClient },
}: Context) =>
  httpClient.get<AppSettingsInput>(ENDPOINTS.defaultSettings).catch(() => {
    throw new Error('admin/settings.default.error')
  })

export const httpGetResolverFactory = <Response>(url: string) => async (
  _: unknown,
  __: unknown,
  context: Context
) => context.clients.httpClient.get<Response>(url)
