import type { MutationUpdateAppSettingsArgs } from 'ssesandbox04.catalog-importer'

export const updateAppSettings = async (
  _: unknown,
  { settings: newSettings }: MutationUpdateAppSettingsArgs,
  context: Context
) => {
  const payload = { ...context.state.body.settings, ...newSettings }

  context.clients.apps.saveAppSettings(
    process.env.VTEX_APP_ID as string,
    payload
  )

  return payload
}
