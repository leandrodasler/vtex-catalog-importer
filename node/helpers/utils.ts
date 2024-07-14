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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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

    if (data.length) {
      if (allData.length % 5000 === 0) {
        await delay(1000)
      }

      await getAll()
    }
  }

  await getAll()

  return allData
}

const DEFAULT_BATCH_CONCURRENCY = 1000

export const batch = async <T>(
  data: T[],
  elementCallback: (element: T) => Promise<unknown>,
  concurrency = DEFAULT_BATCH_CONCURRENCY
) => {
  const cloneData = [...data]

  const processBatch = async () => {
    if (!cloneData.length) return
    await Promise.all(cloneData.splice(0, concurrency).map(elementCallback))
    await processBatch()
  }

  await processBatch()
}

export const updateImport = async (
  context: AppEventContext,
  fields: Partial<ProcessImport>
) => {
  if (!context.state.body.id) return
  await context.clients.importExecution
    .update(context.state.body.id, fields)
    .then(() => (context.state.body = { ...context.state.body, ...fields }))
    .catch(() => {})
}
