/* eslint-disable no-console */

import {
  batch,
  handleError,
  IMPORT_EXECUTION_FULL_FIELDS,
  IMPORT_STATUS,
  STEPS_HANDLERS,
  updateImport,
} from '../helpers'

const runImport = async (context: AppEventContext) => {
  try {
    console.log('========================')
    console.log('"runImport" EVENT with async batch of steps')
    console.log(context.state.body)

    const { id, settings } = context.state.body

    if (!id) return

    const { importExecution, httpClient } = context.clients

    if (!settings) {
      throw new Error('admin/settings.missing.error')
    }

    const importData = await importExecution.get(
      id,
      IMPORT_EXECUTION_FULL_FIELDS
    )

    httpClient.setSettings(settings)
    context.state.body = { ...importData, settings }

    await updateImport(context, { status: IMPORT_STATUS.RUNNING })
    batch(STEPS_HANDLERS, (step) => step(context), 1)
  } catch (error) {
    await handleError(context, error)
  }
}

export default { runImport }
