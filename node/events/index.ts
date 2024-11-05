import {
  handleError,
  IMPORT_EXECUTION_FULL_FIELDS,
  IMPORT_STATUS,
  processStepFactory,
  sequentialBatch,
  STEPS_HANDLERS,
  updateCurrentImport,
} from '../helpers'

let currentImportId: string | null = null

export function getCurrentImportId() {
  return currentImportId
}

export function setCurrentImportId(id: string | null) {
  currentImportId = id
}

const runImport = async (context: AppEventContext) => {
  try {
    const { id, settings } = context.state.body

    if (!id) return

    if (!settings) {
      throw new Error('admin/settings.missing.error')
    }

    const { importExecution, httpClient, sourceCatalog } = context.clients
    const importData = await importExecution.get(
      id,
      IMPORT_EXECUTION_FULL_FIELDS
    )

    if (
      !importData ||
      importData.status !== IMPORT_STATUS.PENDING ||
      importData.currentEntity ||
      getCurrentImportId()
    ) {
      return
    }

    setCurrentImportId(id)

    const currentSettings = settings.useDefault
      ? await httpClient.getDefaultSettings()
      : settings

    sourceCatalog.setSettings(currentSettings)
    context.state.body = { ...importData, settings: currentSettings }
    await updateCurrentImport(context, { status: IMPORT_STATUS.RUNNING })
    sequentialBatch(STEPS_HANDLERS, processStepFactory(context))
  } catch (error) {
    await handleError(context, error)
  }
}

export default runImport
