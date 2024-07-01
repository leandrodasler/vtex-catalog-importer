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
  { fields, where, sort }: ScrollInput<T>
) => {
  const allData: Array<WithInternalFields<T>> = []
  let currentPage = 1

  const getAll = async () => {
    const {
      data,
      pagination: { total },
    } = await client.searchRaw(
      { page: currentPage, pageSize: 100 },
      fields,
      sort,
      where
    )

    allData.push(...((data as unknown) as Array<WithInternalFields<T>>))

    currentPage++

    if (total > allData.length) {
      await getAll()
    }
  }

  await getAll()

  return allData
}
