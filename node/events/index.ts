/* eslint-disable no-console */

import {
  batch,
  getDefaultSettings,
  handleError,
  IMPORT_EXECUTION_FULL_FIELDS,
  IMPORT_STATUS,
  processStepFactory,
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

    if (!settings) {
      throw new Error('admin/settings.missing.error')
    }

    const currentSettings = settings.useDefault
      ? await getDefaultSettings(context)
      : settings

    const { importExecution, httpClient } = context.clients
    const importData = await importExecution.get(
      id,
      IMPORT_EXECUTION_FULL_FIELDS
    )

    httpClient.setSettings(currentSettings)
    context.state.body = { ...importData, settings: currentSettings }
    await updateImport(context, { status: IMPORT_STATUS.RUNNING })
    batch(STEPS_HANDLERS, processStepFactory(context), 1)
  } catch (error) {
    await handleError(context, error)
  }
}

export default { runImport }
