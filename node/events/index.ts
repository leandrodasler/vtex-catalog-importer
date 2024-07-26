import {
  batch,
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

    const { importExecution, httpClient, sourceCatalog } = context.clients
    const currentSettings = settings.useDefault
      ? await httpClient.getDefaultSettings()
      : settings

    const importData = await importExecution.get(
      id,
      IMPORT_EXECUTION_FULL_FIELDS
    )

    sourceCatalog.setSettings(currentSettings)
    context.state.body = { ...importData, settings: currentSettings }
    await updateCurrentImport(context, { status: IMPORT_STATUS.RUNNING })
    batch(STEPS_HANDLERS, processStepFactory(context), 1)
  } catch (error) {
    await handleError(context, error)
  }
}

export default { runImport }
