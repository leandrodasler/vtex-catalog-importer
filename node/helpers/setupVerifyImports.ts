import {
  delay,
  deleteImport,
  getFirstImportPending,
  getFirstImportRunning,
  getFirstImportToBeDeleted,
  getLastEntity,
  IMPORT_STATUS,
  updateImportStatus,
} from '.'
import runImport from '../events'

const TIMEOUT = 10000
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

    if (lastEntity?.createdIn) {
      const diffDate = Date.now() - new Date(lastEntity.createdIn).getTime()
      const maxMinutes = context.vtex.workspace === 'master' ? 60 : 10

      if (diffDate > maxMinutes * 60 * 1000) {
        await updateImportStatus(
          context,
          importRunning.id,
          IMPORT_STATUS.PENDING
        )
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

  if (!nextPendingImport) return

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
