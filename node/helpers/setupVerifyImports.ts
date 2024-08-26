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

export const getCachedContext = () => {
  return cachedContext
}

export function setCachedContext(context: Context) {
  cachedContext = context
}

let someImportRan = false

const verifyImports = async () => {
  const context = getCachedContext()

  if (!context) return

  const firstImportRunning = await getFirstImportRunning(context)

  if (firstImportRunning) {
    if (!someImportRan) {
      await updateImportStatus(
        context,
        firstImportRunning.id,
        IMPORT_STATUS.PENDING
      )
    }

    return
  }

  const nextImportToBeDeleted = await getFirstImportToBeDeleted(context)

  if (nextImportToBeDeleted) {
    deleteImport(context, nextImportToBeDeleted.id)

    return
  }

  const nextPendingImport = await getFirstImportPending(context)

  if (!nextPendingImport) return

  someImportRan = true
  context.state.body = nextPendingImport
  runImport(context)
}

export const setupVerifyImports = () => {
  setInterval(() => verifyImports().catch(() => {}), TIMEOUT)
}
