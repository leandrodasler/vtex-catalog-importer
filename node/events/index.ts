/* eslint-disable no-console */
import type { Maybe } from '@vtex/api'
import type { Brand } from '@vtex/clients'

import {
  ENDPOINTS,
  IMPORT_EXECUTION_FULL_FIELDS,
  IMPORT_STATUS,
  brandMapper,
} from '../helpers'

const runImport = async (context: AppEventContext) => {
  console.log('========================')
  console.log('RUN IMPORT EVENT')
  console.log(context.state.body)
  const { id, settings } = context.state.body
  const { importExecution, importEntity, httpClient } = context.clients

  if (!id || !settings) {
    throw new Error('admin/settings.missing.error')
  }

  try {
    const importData = await importExecution.get(
      id,
      IMPORT_EXECUTION_FULL_FIELDS
    )

    console.log({ importData })

    await importExecution.update(id, {
      ...importData,
      status: IMPORT_STATUS.RUNNING,
    })

    context.state.body = { ...importData, status: IMPORT_STATUS.RUNNING }

    httpClient.setSettings(settings)
    const brands = await context.clients.httpClient
      .get<Maybe<Brand[]>>(ENDPOINTS.brands.get)
      .catch((e) => {
        throw new Error(`Error getting brands: ${e.message}`)
      })

    console.log({ brands })

    if (brands) {
      await Promise.all(
        brands.map(brandMapper).map(async (brand) =>
          importEntity.save({
            executionImportId: id,
            name: 'brand',
            sourceAccount: settings.account ?? '',
            sourceId: String(brand.Id),
            payload: { ...brand, Id: undefined },
          })
        )
      )
    }
  } catch (e) {
    await importExecution.update(id, {
      ...context.state.body,
      status: IMPORT_STATUS.ERROR,
      error: e.message,
    })
  }
}

export default { runImport }
