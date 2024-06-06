import type { AppSettingsInput } from 'ssesandbox04.catalog-importer'

const DEFAULT_SETTINGS_URL =
  'http://ssesandbox04.myvtex.com/catalog-importer-configuration/settings'

export const getCurrentSettings = async ({ clients: { apps } }: Context) =>
  apps.getAppSettings(process.env.VTEX_APP_ID as string) as AppSettingsInput

export const getDefaultSettings = async ({
  clients: { httpClient },
}: Context) => {
  const defaultSettings = await httpClient
    .get<AppSettingsInput>(DEFAULT_SETTINGS_URL)
    .catch(() => {
      throw new Error('admin/settings.default.error')
    })

  return defaultSettings.data
}
