/* eslint-disable no-console */

import {
  IMPORT_EXECUTION_FULL_FIELDS,
  IMPORT_STATUS,
  updateImportStatus,
} from '../helpers'
import { brands } from './steps/01-brands'
import { categories } from './steps/02-categories'

const runImport = async (context: AppEventContext) => {
  console.log('========================')
  console.log('"runImport" EVENT')
  console.log(context.state.body)

  const { id, settings } = context.state.body

  if (!id) {
    return
  }

  const { importExecution, httpClient } = context.clients

  try {
    if (!settings) {
      throw new Error('admin/settings.missing.error')
    }

    httpClient.setSettings(settings)
    const importData = await importExecution.get(
      id,
      IMPORT_EXECUTION_FULL_FIELDS
    )

    context.state.body = {
      ...importData,
      settings,
    }

    await updateImportStatus(context, IMPORT_STATUS.RUNNING)
    await brands(context)
    await categories(context)
  } catch (e) {
    const step = context.state.step ?? 'starting import'
    const errorDetail = e.response?.data?.Message
    const error = `Error at step "${step}": ${e.message}${
      errorDetail ? ` - ${errorDetail}` : ''
    }`

    console.log('========================')
    console.log(`ERROR at step ${step}:`)
    console.log(error)

    await updateImportStatus(context, IMPORT_STATUS.ERROR, error)
  }
}

export default { runImport }
