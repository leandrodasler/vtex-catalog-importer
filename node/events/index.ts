/* eslint-disable no-console */

import { IMPORT_EXECUTION_FULL_FIELDS, IMPORT_STATUS } from '../helpers'
import { brands } from './steps/01-brands'
import { categories } from './steps/02-categories'

const runImport = async (context: AppEventContext) => {
  console.log('========================')
  console.log('"runImport" EVENT')
  console.log(context.state.body)

  const { importExecution, httpClient } = context.clients
  const { id, settings } = context.state.body

  if (!id || !settings) {
    throw new Error('admin/settings.missing.error')
  }

  httpClient.setSettings(settings)

  try {
    const importData = await importExecution.get(
      id,
      IMPORT_EXECUTION_FULL_FIELDS
    )

    await context.clients.importExecution.update(id, {
      ...importData,
      status: IMPORT_STATUS.RUNNING,
    })

    context.state.body = {
      ...importData,
      settings,
      status: IMPORT_STATUS.RUNNING,
    }

    await brands(context)
    await categories(context)
  } catch (e) {
    await importExecution
      .update(id, {
        ...context.state.body,
        status: IMPORT_STATUS.ERROR,
        error: e.message,
      })
      .catch(() => {})
  }
}

export default { runImport }
