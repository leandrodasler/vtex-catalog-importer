import {
  deleteImport,
  getFirstImportPending,
  getFirstImportRunning,
  getFirstImportToBeDeleted,
} from '.'

let cachedContext: Context | undefined
const TIMEOUT = 10000

export const getCachedContext = () => {
  return cachedContext
}

export function setCachedContext(context: Context) {
  cachedContext = context
}

const verifyImports = async () => {
  const context = getCachedContext()

  if (!context || (await getFirstImportRunning(context))) return
  const nextPendingImport = await getFirstImportPending(context)

  if (nextPendingImport) {
    context.clients.events.sendEvent('', 'runImport', nextPendingImport)
  } else {
    const nextImportToBeDeleted = await getFirstImportToBeDeleted(context)

    if (nextImportToBeDeleted) {
      deleteImport(context, nextImportToBeDeleted.id)
    }
  }
}

export const setupVerifyImports = () => {
  setInterval(() => verifyImports().catch(() => {}), TIMEOUT)
}
