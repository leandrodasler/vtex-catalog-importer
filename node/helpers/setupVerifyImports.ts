import {
  deleteImport,
  getFirstImportPending,
  getFirstImportRunning,
  getFirstImportToBeDeleted,
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

  if (!context || (await getFirstImportRunning(context))) return

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
  setInterval(() => verifyImports().catch(() => {}), TIMEOUT)
}
