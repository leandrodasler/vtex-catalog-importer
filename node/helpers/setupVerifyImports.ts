import {
  deleteImport,
  getFirstImportPending,
  getFirstImportProcessing,
  getFirstImportToBeDeleted,
} from '.'

let cachedContext: Context | null = null
const TIMEOUT = 10000

export const getCachedContext = () => {
  return cachedContext
}

export function setCachedContext(context: Context) {
  cachedContext = context
}

const verifyImports = async () => {
  const context = getCachedContext()

  if (!context) return
  const hasImportProcessing = await getFirstImportProcessing()

  if (hasImportProcessing) return
  const nextPendingImport = await getFirstImportPending()

  if (nextPendingImport) {
    context.clients.events.sendEvent('', 'runImport', nextPendingImport)
  } else {
    const nextImportToBeDeleted = await getFirstImportToBeDeleted()

    if (nextImportToBeDeleted) {
      deleteImport(nextImportToBeDeleted.id)
    }
  }
}

export const setupVerifyImports = () => {
  setInterval(() => verifyImports().catch(() => {}), TIMEOUT)
}
