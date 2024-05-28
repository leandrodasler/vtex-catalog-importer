import type { MutationUpdateAppSettingsArgs } from 'ssesandbox04.catalog-importer'

export const updateAppSettings = async (
  _: unknown,
  { newSettings }: MutationUpdateAppSettingsArgs,
  context: Context
) => {
  const payload = { ...context.state.body.settings, ...newSettings }
  const appId = process.env.VTEX_APP_ID as string

  // eslint-disable-next-line no-console
  console.log('updateAppSettings resolver:', { payload })

  await context.clients.apps.saveAppSettings(appId, payload)
  context.state.body = { settings: payload }

  return payload
}
