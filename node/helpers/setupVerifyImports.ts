import {
  delay,
  deleteImport,
  FileManager,
  getFirstImportPending,
  getFirstImportRunning,
  getFirstImportToBeDeleted,
} from '.'
import { getCurrentImportId } from '../events'

const TIMEOUT = 10000

let cachedContext: Context | undefined

export function getCachedContext() {
  return cachedContext
}

export function setCachedContext(context: Context) {
  cachedContext = context
}

const SETUP_FILE = new FileManager('SETUP_FILE')

SETUP_FILE.appendLine(new Date().toISOString())

const verifyImports = async () => {
  const context = getCachedContext()

  if (!context) return

  const importRunning = await getFirstImportRunning(context)

  if (importRunning) {
    if (importRunning.entityEvent) {
      await context.clients.events.sendEvent('', 'runStep', {
        step: importRunning.entityEvent,
        adminUserAuthToken: context.vtex.adminUserAuthToken,
        ...importRunning,
      })

      return
    }

    const setupFileStats = await SETUP_FILE.getStats()

    const importRunningLastInteractionInMs = new Date(
      importRunning.lastInteractionIn
    ).getTime()

    if (
      setupFileStats.mtimeMs > importRunningLastInteractionInMs &&
      importRunning.currentEntity
    ) {
      await context.clients.importExecution.update(importRunning.id, {
        entityEvent: importRunning.currentEntity,
      })
    }

    return
  }

  const nextImportToBeDeleted = await getFirstImportToBeDeleted(context)

  if (nextImportToBeDeleted) {
    deleteImport(context, nextImportToBeDeleted)

    return
  }

  const nextPendingImport = await getFirstImportPending(context)

  if (!nextPendingImport || getCurrentImportId()) return

  const { adminUserAuthToken } = context.vtex

  context.clients.events.sendEvent('', 'runStep', {
    adminUserAuthToken,
    ...nextPendingImport,
  })
}

export const setupVerifyImports = () => {
  verifyImports()
    .then(async () => {
      await delay(TIMEOUT)
      setupVerifyImports()
    })
    .catch(() => {})
}
