import type { ErrorLike, Maybe } from '@vtex/api'
import type { AppSettingsInput } from 'ssesandbox04.catalog-importer'

import {
  DEFAULT_CONCURRENCY,
  DEFAULT_VBASE_BUCKET,
  IMPORT_EXECUTION_FIELDS,
  IMPORT_STATUS,
  MAX_RETRIES,
  STEP_DELAY,
  STEPS,
  STEPS_ENTITIES,
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
      message.includes('network error') ||
      message.includes('networkerror') ||
      message.includes('genericerror') ||
      message.includes('unhealthy')

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
  const cloneData = [...data]
  const results: R[] = []

  const processBatch = async () => {
    if (!cloneData.length) return

    const result = ((await Promise.all(
      cloneData.splice(0, concurrency).map(async (element) => {
        return promiseWithConditionalRetry(elementCallback, element)
      })
    )) as unknown) as R

    if (result) {
      results.push(result)
    }

    await processBatch()
  }

  await processBatch()

  return results.flat()
}

export const sequentialBatch = async <T, R = void>(
  data: T[],
  elementCallback: (element: T) => Promise<Maybe<R>> | R
) => {
  return batch(data, elementCallback, 1)
}

export const handleError = async (context: AppEventContext, e: ErrorLike) => {
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

  const error = `${e.message}${errorDetailFormatted}${requestError}`
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

  const currentImport = await context.clients.importExecution.get(
    context.state.body.id,
    IMPORT_EXECUTION_FIELDS
  )

  if (
    currentImport.currentEntity &&
    STEPS_ENTITIES.indexOf(currentImport.currentEntity as string) >=
      STEPS_ENTITIES.indexOf(nextEntity)
  ) {
    return
  }

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
