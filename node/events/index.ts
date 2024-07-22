import {
  batch,
  getDefaultSettings,
  handleError,
  IMPORT_EXECUTION_FULL_FIELDS,
  IMPORT_STATUS,
  processStepFactory,
  STEPS_HANDLERS,
  updateCurrentImport,
} from '../helpers'

const runImport = async (context: AppEventContext) => {
  try {
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
    await updateCurrentImport(context, { status: IMPORT_STATUS.RUNNING })
    batch(STEPS_HANDLERS, processStepFactory(context), 1)
  } catch (error) {
    await handleError(context, error)
  }
}

export default { runImport }
