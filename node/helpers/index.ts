import type { AppSettingsInput } from 'ssesandbox04.catalog-importer'

export const getCurrentSettings = async ({ clients: { apps } }: Context) => {
  const currentSettings = (await apps.getAppSettings(
    process.env.VTEX_APP_ID as string
  )) as AppSettingsInput

  // eslint-disable-next-line no-console
  console.log('WithSettings - using current settings:', currentSettings)

  return currentSettings
}

export const getDefaultSettings = async ({
  clients: { httpClient },
}: Context) => {
  httpClient.setSettings({ account: 'ssesandbox04' })
  const defaultSettings = await httpClient
    .get<AppSettingsInput>('/catalog-importer-configuration/settings')
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.log('WithSettings - error getting default settings:', e)
      // eslint-disable-next-line no-console
      console.log('===================================================')
      throw new Error('admin/settings.default.error')
    })
    .finally(() => {
      httpClient.setSettings({})
    })

  // eslint-disable-next-line no-console
  console.log('WithSettings - using default settings:', defaultSettings.data)

  return defaultSettings.data
}
