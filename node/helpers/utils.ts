import type { ErrorLike, Maybe } from '@vtex/api'
import pLimit from 'p-limit'
import type { AppSettingsInput } from 'ssesandbox04.catalog-importer'

import {
  DEFAULT_CONCURRENCY,
  DEFAULT_VBASE_BUCKET,
  FILE_PREFIXES,
  FileManager,
  IMPORT_STATUS,
  MAX_RETRIES,
  STEP_DELAY,
  STEPS,
} from '.'
import { updateCurrentImport } from './importDBUtils'

export const getCurrentSettings = async ({ clients: { apps } }: Context) =>
  apps.getAppSettings(process.env.VTEX_APP_ID as string) as AppSettingsInput

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const promiseWithConditionalRetry = async <T, R = void>(
  fn: (arg: T) => Promise<R> | R,
  arg: T,
  retries = 0
): Promise<R> => {
  return Promise.resolve(fn?.(arg))?.catch(async (e) => {
    const message = e.message.toLowerCase()
    const messageToRetry =
      message.includes('400') ||
      message.includes('429') ||
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504') ||
      message.includes('network error') ||
      message.includes('networkerror') ||
      message.includes('genericerror') ||
      message.includes('unhealthy') ||
      message.includes('econnrefused')

    if (messageToRetry && retries < MAX_RETRIES) {
      await delay(STEP_DELAY * (retries + 1))

      return promiseWithConditionalRetry(fn, arg, retries + 1)
    }

    throw e
  })
}

export const batch = async <T, R = void>(
  data: T[],
  elementCallback: (element: T) => Promise<Maybe<R>> | R,
  concurrency = DEFAULT_CONCURRENCY
) => {
  const limit = pLimit(concurrency)

  const results = await Promise.all(
    data.map((element) =>
      limit(() => promiseWithConditionalRetry(elementCallback, element))
    )
  )

  return results.filter(Boolean).flat() as R[]
}

export const sequentialBatch = async <T, R = void>(
  data: T[],
  elementCallback: (element: T) => Promise<Maybe<R>> | R
) => {
  return batch(data, elementCallback, 1)
}

export function getError(e: ErrorLike) {
  const data = e.response?.data
  const statusText = e.response?.statusText
  const fallbackMessage = data && typeof data === 'string' ? data : statusText
  const errorDetail = data?.Message ?? data?.message ?? fallbackMessage
  const errorDetailFormatted = errorDetail ? ` - ${errorDetail}` : ''
  const requestError =
    e.config?.method && e.config?.url
      ? ` - Request data: ${e.config.method.toUpperCase()} ${e.config.url} ${
          e.config?.data ?? ''
        }`
      : ''

  return `${e.message}${errorDetailFormatted}${requestError}`
}

export const handleError = async (context: AppEventContext, e: ErrorLike) => {
  const error = getError(e)
  const entityError = context.state.entity

  await delay(STEP_DELAY)
  await updateCurrentImport(context, {
    status: IMPORT_STATUS.ERROR,
    error,
    entityError,
  })
}

export const processStepFactory = (context: AppEventContext) => async (
  step: (context: AppEventContext) => Promise<void>
) => {
  const nextEntity = STEPS.find(({ handler }) => handler === step)?.entity

  if (context.state.body.error || !context.state.body.id || !nextEntity) return

  await delay(STEP_DELAY)

  context.state.entity = nextEntity

  await updateCurrentImport(context, {
    currentEntity: nextEntity,
    status: IMPORT_STATUS.RUNNING,
  })

  await delay(STEP_DELAY)

  return step(context).catch((e) => handleError(context, e))
}

export const incrementVBaseEntity = async (context: AppEventContext) => {
  const { vbase } = context.clients
  const { id = '' } = context.state.body
  const { entity = '' } = context.state
  const json =
    (await vbase.getJSON<VBaseJSON>(DEFAULT_VBASE_BUCKET, id, true)) ?? {}

  const newJson = { ...json, [entity]: (json[entity] ?? 0) + 1 }

  return vbase.saveJSON(DEFAULT_VBASE_BUCKET, id, newJson)
}

export const deleteImportFiles = (executionImportId: string) => {
  return Promise.all(
    FILE_PREFIXES.map((prefix) =>
      new FileManager(`${prefix}-${executionImportId}`).delete()
    )
  )
}

export function formatFileSize(bytes: number) {
  const units = ['bytes', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(
    size
  )} ${units[unitIndex]}`
}
