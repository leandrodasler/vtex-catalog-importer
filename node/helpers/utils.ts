import type { ErrorLike, Maybe } from '@vtex/api'
import type { AppSettingsInput } from 'ssesandbox04.catalog-importer'

import { DEFAULT_BATCH_CONCURRENCY, IMPORT_STATUS, STEP_DELAY, STEPS } from '.'
import { updateCurrentImport } from './importDBUtils'

export const getCurrentSettings = async ({ clients: { apps } }: Context) =>
  apps.getAppSettings(process.env.VTEX_APP_ID as string) as AppSettingsInput

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const batch = async <T, R = void>(
  data: T[],
  elementCallback: (element: T) => Maybe<Promise<R>> | R,
  concurrency = DEFAULT_BATCH_CONCURRENCY
) => {
  const cloneData = [...data]
  const results: R[] = []

  const processBatch = async () => {
    if (!cloneData.length) return

    const result = ((await Promise.all(
      cloneData.splice(0, concurrency).map(elementCallback)
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
  elementCallback: (element: T) => Maybe<Promise<R>> | R
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
  if (context.state.body.error) return
  await delay(STEP_DELAY)
  context.state.entity = STEPS.find(({ handler }) => handler === step)?.entity

  return step(context).catch((e) => handleError(context, e))
}
