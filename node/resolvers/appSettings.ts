export const appSettings = async (
  _: unknown,
  __: unknown,
  { clients: { apps } }: Context
) => {
  const {
    account = '',
    vtexAppKey = '',
    vtexAppToken = '',
  } = (await apps.getAppSettings(process.env.VTEX_APP_ID as string)) as Settings

  return { account, vtexAppKey, vtexAppToken }
}
