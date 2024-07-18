/* eslint-disable no-console */
import type { ErrorLike, Maybe } from '@vtex/api'
import type {
  MasterDataEntity,
  ScrollInput,
} from '@vtex/clients/build/clients/masterData/MasterDataEntity'
import type {
  AppSettingsInput,
  ImportExecution,
  ImportStatus,
} from 'ssesandbox04.catalog-importer'

import {
  ENDPOINTS,
  getCachedContext,
  IMPORT_EXECUTION_FIELDS,
  IMPORT_STATUS,
  STEPS,
} from '.'

export const getCurrentSettings = async ({ clients: { apps } }: Context) =>
  apps.getAppSettings(process.env.VTEX_APP_ID as string) as AppSettingsInput

export const getDefaultSettings = async ({
  clients: { httpClient },
}: Context | AppEventContext) =>
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

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

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
  elementCallback: (element: T) => Maybe<Promise<unknown>>,
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

const setImportStatus = async (id: string, status: ImportStatus) => {
  const context = getCachedContext()

  if (!context) return null

  return context.clients.importExecution.update(id, { status })
}

export const setImportToBeDeleted = async (id: string) =>
  setImportStatus(id, IMPORT_STATUS.TO_BE_DELETED)

export const deleteImport = async (importId: string) => {
  const context = getCachedContext()

  if (!context) return

  const { importExecution, importEntity } = context.clients

  await setImportStatus(importId, IMPORT_STATUS.DELETING)

  entityGetAll(importEntity, {
    fields: ['id'],
    where: `executionImportId=${importId}`,
  }).then((data) =>
    batch(data, ({ id }) => importEntity.delete(id)).then(() =>
      importExecution.delete(importId)
    )
  )
}

const getFirstImportByStatus = async (status: ImportStatus[]) => {
  const context = getCachedContext()

  if (!context) return null

  return context.clients.importExecution
    .searchRaw(
      { page: 1, pageSize: 1 },
      IMPORT_EXECUTION_FIELDS,
      'createdIn asc',
      status.map((s) => `(status=${s})`).join('OR')
    )
    .then(
      ({ data }) =>
        (data[0] as unknown) as Maybe<WithInternalFields<ImportExecution>>
    )
}

export const getFirstImportProcessing = async () =>
  getFirstImportByStatus([IMPORT_STATUS.RUNNING, IMPORT_STATUS.DELETING])

export const getFirstImportPending = async () =>
  getFirstImportByStatus([IMPORT_STATUS.PENDING])

export const getFirstImportToBeDeleted = async () =>
  getFirstImportByStatus([IMPORT_STATUS.TO_BE_DELETED])

export const printImport = (context: AppEventContext) => {
  const {
    entity,
    body: {
      id,
      status,
      sourceBrandsTotal,
      sourceCategoriesTotal,
      sourceProductsTotal,
      sourceSkusTotal,
      sourcePricesTotal,
      sourceStocksTotal,
      error,
      entityError,
    },
  } = context.state

  if (entity) {
    console.log('========================')
    console.log(`import step for entity "${entity}"`)
  }

  console.log(
    `IMPORT #${id} - status: ${status} | sourceBrandsTotal: ${sourceBrandsTotal} | sourceCategoriesTotal: ${sourceCategoriesTotal} | sourceProductsTotal: ${sourceProductsTotal} | sourceSkusTotal: ${sourceSkusTotal} | sourcePricesTotal: ${sourcePricesTotal} | sourceStocksTotal: ${sourceStocksTotal} | error: ${error} | entityError: ${entityError}`
  )
}

export const handleError = async (context: AppEventContext, e: ErrorLike) => {
  const errorDetailMessage = e.response?.data?.Message
  const errorDetail = errorDetailMessage ? ` - ${errorDetailMessage}` : ''
  const error = `${e.message}${errorDetail}`
  const entityError = context.state.entity

  console.log('========================')
  console.log(error)

  await delay(1000)
  await updateImport(context, {
    status: IMPORT_STATUS.ERROR,
    error,
    entityError,
  })

  printImport(context)
}

export const processStepFactory = (context: AppEventContext) => (
  step: (context: AppEventContext) => Promise<void>
) => {
  if (context.state.body.error) return

  context.state.entity = STEPS.find(({ handler }) => handler === step)?.entity
  printImport(context)

  return step(context).catch((e) => handleError(context, e))
}
