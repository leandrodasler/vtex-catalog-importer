/* eslint-disable no-console */
import type {
  MasterDataEntity,
  ScrollInput,
} from '@vtex/clients/build/clients/masterData/MasterDataEntity'
import type {
  AppSettingsInput,
  ImportStatus,
} from 'ssesandbox04.catalog-importer'

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
      // { page: currentPage, pageSize: 100 },
      ...input,
      size: 1000,
      mdToken: currentMdToken || undefined,
    })

    allData.push(...((data as unknown) as Array<WithInternalFields<T>>))

    currentMdToken = currentMdToken || mdToken

    console.log({ size: allData.length })

    if (data.length) {
      if (allData.length % 5000 === 0) {
        await delay(1000)
      }

      await getAll()
    }
  }

  console.log('getAll:', {
    ...input,
    entity: client.dataEntity,
    schema: client.schema,
  })

  await getAll()

  console.log('finished getAll:', { size: allData.length })

  return allData
}

const BATCH_CONCURRENCY = 1000

export const batch = async <T>(
  data: T[],
  elementCallback: (element: T) => Promise<unknown>
) => {
  const cloneData = [...data]

  const processBatch = async (): Promise<void> => {
    if (!cloneData.length) {
      return
    }

    console.log(
      'batch remaining size:',
      cloneData.length < 10 ? cloneData : cloneData.length
    )

    await Promise.all(
      cloneData.splice(0, BATCH_CONCURRENCY).map(elementCallback)
    )

    await processBatch()
  }

  console.log('init process batch')

  await processBatch()

  console.log('finished process batch with total:', data.length)
}

export const updateImportStatus = async (
  context: AppEventContext,
  status: ImportStatus,
  error?: Error
) => {
  if (!context.state.body.id) {
    return
  }

  await context.clients.importExecution
    .update(context.state.body.id, {
      ...(error && { error: error.message }),
      status,
    })
    .then(() => {
      context.state.body.status = status
    })
    .catch(() => {})
}
