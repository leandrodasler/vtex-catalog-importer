import {
  deleteImport,
  getFirstImportPending,
  getFirstImportRunning,
  getFirstImportToBeDeleted,
  IMPORT_STATUS,
  updateImportStatus,
} from '.'
import runImport from '../events'

let cachedContext: Context | undefined
const TIMEOUT = 10000
let hasImportRun = false

export function getCachedContext() {
  return cachedContext
}

export function setCachedContext(context: Context) {
  cachedContext = context
}

export function setHasImportRun() {
  hasImportRun = true
}

export function getHasImportRun() {
  return hasImportRun
}

const verifyImports = async () => {
  const context = getCachedContext()

  if (!context) return

  const importRunning = await getFirstImportRunning(context)

  if (importRunning && getHasImportRun()) return

  const nextImportToBeDeleted = await getFirstImportToBeDeleted(context)

  if (nextImportToBeDeleted) {
    deleteImport(context, nextImportToBeDeleted)

    return
  }

  const nextPendingImport =
    importRunning && !getHasImportRun()
      ? importRunning
      : await getFirstImportPending(context)

  if (!nextPendingImport) return

  if (nextPendingImport.status === IMPORT_STATUS.RUNNING) {
    await updateImportStatus(
      context,
      nextPendingImport.id,
      IMPORT_STATUS.PENDING
    )
  }

  context.state.body = nextPendingImport
  runImport(context)
  setHasImportRun()
}

export const setupVerifyImports = () => {
  setInterval(() => verifyImports().catch(() => {}), TIMEOUT)
}
