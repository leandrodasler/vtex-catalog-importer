import {
  handleError,
  IMPORT_EXECUTION_FULL_FIELDS,
  IMPORT_STATUS,
  processStepFactory,
  sequentialBatch,
  STEPS,
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

export async function runStep(context: AppEventContext) {
  const {
    step = 'category',
    adminUserAuthToken,
    ...importRunning
  } = context.body

  try {
    const { id, settings } = importRunning

    if (!id) return

    if (!settings) {
      throw new Error('admin/settings.missing.error')
    }

    const {
      importExecution,
      httpClient,
      sourceCatalog,
      targetCatalog,
    } = context.clients

    const importData = await importExecution.get(
      id,
      IMPORT_EXECUTION_FULL_FIELDS
    )

    if (!importData) return

    const currentSettings = settings.useDefault
      ? await httpClient.getDefaultSettings()
      : settings

    sourceCatalog.setSettings(currentSettings)
    targetCatalog.setAdminUserAuthToken(adminUserAuthToken)
    context.state.body = { ...importData, settings: currentSettings }

    await updateCurrentImport(context, {
      status: IMPORT_STATUS.RUNNING,
      entityEvent: null,
    })

    const handler = STEPS.find(({ entity }) => entity === step)?.handler

    if (handler) {
      processStepFactory(context)(handler)
    }
  } catch (error) {
    await handleError(context, error)
  }
}

export async function runImportEvent(context: CustomEventContext) {
  const { adminUserAuthToken, ...pendingImport } = context.body

  context.state.body = pendingImport
  context.clients.targetCatalog.setAdminUserAuthToken(adminUserAuthToken)

  runImport((context as unknown) as AppEventContext)
}

export default { runImportEvent, runStep }
