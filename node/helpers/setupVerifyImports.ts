import {
  delay,
  deleteImport,
  getFirstImportPending,
  getFirstImportRunning,
  getFirstImportToBeDeleted,
  getLastEntity,
  IMPORT_STATUS,
} from '.'
import runImport, { getCurrentImportId } from '../events'

const TIMEOUT = 10000
const MAX_TIME_LAST_ENTITY = 15 * 60 * 1000

let cachedContext: Context | undefined

export function getCachedContext() {
  return cachedContext
}

export function setCachedContext(context: Context) {
  cachedContext = context
}

const verifyImports = async () => {
  const context = getCachedContext()

  if (!context) return

  const importRunning = await getFirstImportRunning(context)

  if (importRunning) {
    const lastEntity = await getLastEntity(context, importRunning)

    if (lastEntity) {
      const diffDate =
        Date.now() - new Date(lastEntity.lastInteractionIn).getTime()

      if (diffDate > MAX_TIME_LAST_ENTITY) {
        await context.clients.importEntity.update(lastEntity.id, {
          updated: Date.now(),
        })

        await context.clients.importExecution.update(importRunning.id, {
          currentEntity: null,
          status: IMPORT_STATUS.PENDING,
        })

        await delay(TIMEOUT)
      }
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

  context.state.body = nextPendingImport
  runImport(context)
}

export const setupVerifyImports = () => {
  verifyImports()
    .then(async () => {
      await delay(TIMEOUT)
      setupVerifyImports()
    })
    .catch(() => {})
}
