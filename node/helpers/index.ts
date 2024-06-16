import type { MasterDataEntity } from '@vtex/clients/build/clients/masterData/MasterDataEntity'
import type {
  AppSettingsInput,
  ImportStatus,
} from 'ssesandbox04.catalog-importer'

export const ENDPOINTS = {
  defaultSettings:
    'http://ssesandbox04.myvtex.com/catalog-importer-configuration/settings',
  getUser: '/api/vtexid/credential/validate',
  categories: 'api/catalog_system/pub/category/tree/1000',
}

export const IMPORT_EXECUTION_FIELDS = [
  'user',
  'settings',
  'categoryTree',
  'importImages',
  'importPrices',
  'stocksOption',
  'stockValue',
  'status',
]

export const IMPORT_ENTITY_FIELDS = [
  'name',
  'executionImportId',
  'sourceAccount',
  'sourceId',
  'targetId',
  'pathParams',
  'payload',
]

export const IMPORT_STATUS: { [key in ImportStatus]: ImportStatus } = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
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

export const entityGetAll = async <T extends Record<string, T | unknown>>(
  client: MasterDataEntity<WithInternalFields<T>>,
  fields: string[]
) => {
  const allData: Array<WithInternalFields<T>> = []
  let currentMdToken = ''

  const getAll = async () => {
    const { data, mdToken } = await client.scroll({
      fields,
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
