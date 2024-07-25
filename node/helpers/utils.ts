/* eslint-disable no-console */
import type { ErrorLike, Maybe } from '@vtex/api'
import type { AppSettingsInput, Category } from 'ssesandbox04.catalog-importer'

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

export const flatCategoryTree = (
  categoryTree: Category[],
  level = 0,
  result: Category[][] = []
) => {
  if (!result[level]) {
    result[level] = []
  }

  categoryTree.forEach((category) => {
    result[level].push(category)
    if (category.children?.length) {
      flatCategoryTree(category.children, level + 1, result)
    }
  })

  return result.flat()
}

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
  const errorDetailMessage =
    e.response?.data?.Message ??
    e.response?.data?.message ??
    e.response?.statusText

  const errorDetail = errorDetailMessage ? ` - ${errorDetailMessage}` : ''
  const error = `${e.message}${errorDetail}`
  const entityError = context.state.entity

  console.log('========================')
  console.log(error)
  console.log(e)

  await delay(STEP_DELAY)
  await updateCurrentImport(context, {
    status: IMPORT_STATUS.ERROR,
    error,
    entityError,
  })

  printImport(context)
}

export const processStepFactory = (context: AppEventContext) => async (
  step: (context: AppEventContext) => Promise<void>
) => {
  if (context.state.body.error) return
  await delay(STEP_DELAY)
  context.state.entity = STEPS.find(({ handler }) => handler === step)?.entity
  printImport(context)

  return step(context).catch((e) => handleError(context, e))
}
