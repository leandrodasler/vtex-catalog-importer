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

  if (!id || !settings) {
    throw new Error('admin/settings.missing.error')
  }

  const { importExecution, importEntity, httpClient } = context.clients

  httpClient.setSettings(settings)

  const importData = await importExecution
    .get(id, IMPORT_EXECUTION_FULL_FIELDS)
    .catch((e) => {
      importExecution.update(id, {
        ...context.state.body,
        status: IMPORT_STATUS.ERROR,
        error: e.message,
      })

      throw e
    })

  console.log({ importData })

  importExecution.update(id, { ...importData, status: IMPORT_STATUS.RUNNING })

  const brands = await context.clients.httpClient.get<Maybe<Brand[]>>(
    ENDPOINTS.brands.get
  )

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
}

export default { runImport }
