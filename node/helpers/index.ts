import type { AppSettingsInput } from 'ssesandbox04.catalog-importer'

export const getCurrentSettings = async ({ clients: { apps } }: Context) =>
  apps.getAppSettings(process.env.VTEX_APP_ID as string) as AppSettingsInput

export const getDefaultSettings = async ({
  clients: { httpClient },
}: Context) => {
  httpClient.setSettings({ account: 'ssesandbox04' })

  const defaultSettings = await httpClient
    .get<AppSettingsInput>('catalog-importer-configuration/settings')
    .catch(() => {
      throw new Error('admin/settings.default.error')
    })
    .finally(() => httpClient.setSettings({}))

  return defaultSettings.data
}
