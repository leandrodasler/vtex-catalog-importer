import type {
  MasterDataEntity,
  ScrollInput,
} from '@vtex/clients/build/clients/masterData/MasterDataEntity'
import type { AppSettingsInput } from 'ssesandbox04.catalog-importer'

import { ENDPOINTS } from '.'

export const getCurrentSettings = async ({ clients: { apps } }: Context) =>
  apps.getAppSettings(process.env.VTEX_APP_ID as string) as AppSettingsInput

export const getDefaultSettings = async ({
  clients: { httpClient },
}: Context) =>
  httpClient
    .get<AppSettingsInput>(ENDPOINTS.defaultSettings)
    .catch(() => {
      throw new Error('admin/settings.default.error')
    })
    .then((response) => ({ ...response, useDefault: true }))

export const httpGetResolverFactory = <Response>(url: string) => async (
  _: unknown,
  __: unknown,
  context: Context
) => context.clients.httpClient.get<Response>(url)

export const entityGetAll = async <T extends Record<string, T | unknown>>(
  client: MasterDataEntity<WithInternalFields<T>>,
  input: ScrollInput<T>
) => {
  const allData: Array<WithInternalFields<T>> = []
  let currentMdToken = ''

  const getAll = async () => {
    const { data, mdToken } = await client.scroll({
      ...input,
      size: 1000,
      mdToken: currentMdToken || undefined,
    })

    allData.push(...((data as unknown) as Array<WithInternalFields<T>>))

    currentMdToken = currentMdToken || mdToken

    if (data.length > 0) {
      await getAll()
    }
  }

  await getAll()

  return allData
}
