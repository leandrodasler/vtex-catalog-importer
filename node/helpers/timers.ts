/* eslint-disable no-console */
import { deleteImport, getFirstImportByStatus, IMPORT_STATUS } from '.'

let cachedContext: Context | null = null
const TIMEOUT = 10000

export const getCachedContext = () => {
  return cachedContext
}

export function setCachedContext(context: Context) {
  cachedContext = context
}

const verifyPendingImports = async () => {
  console.log('============================================')
  console.log('VERIFYING PENDING IMPORTS...')
  const context = getCachedContext()

  if (!context) {
    console.log('context was not cached yet...')

    return
  }

  const hasImportRunning = await getFirstImportByStatus(IMPORT_STATUS.RUNNING)

  if (hasImportRunning) {
    console.log('has import running...')

    return
  }

  const nextPendingImport = await getFirstImportByStatus(IMPORT_STATUS.PENDING)

  if (!nextPendingImport) {
    console.log('no pending import...')

    return
  }

  console.log('has pending import:', nextPendingImport)

  await context.clients.events.sendEvent('', 'runImport', nextPendingImport)
}

const verifyImportsToBeDeleted = async () => {
  console.log('============================================')
  console.log('VERIFYING IMPORTS TO BE DELETED...')
  const context = getCachedContext()

  if (!context) {
    console.log('context was not cached yet...')

    return
  }

  const hasImportDeleting = await getFirstImportByStatus(IMPORT_STATUS.DELETING)

  if (hasImportDeleting) {
    console.log('has import deleting...')

    return
  }

  const nextImportToBeDeleted = await getFirstImportByStatus(
    IMPORT_STATUS.TO_BE_DELETED
  )

  if (!nextImportToBeDeleted) {
    console.log('no import to be deleted...')

    return
  }

  console.log('has import to be deleted:', nextImportToBeDeleted)

  deleteImport(nextImportToBeDeleted.id)
}

export const timers = () => {
  setInterval(() => {
    verifyPendingImports().catch((e) => {
      console.log('verifyPendingImports error')
      console.log(e)
    })
  }, TIMEOUT)

  setInterval(() => {
    verifyImportsToBeDeleted().catch((e) => {
      console.log('verifyImportsToBeDeleted error')
      console.log(e)
    })
  }, TIMEOUT)
}
