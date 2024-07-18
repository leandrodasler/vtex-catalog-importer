/* eslint-disable no-console */
import { IMPORT_EXECUTION_FIELDS, IMPORT_STATUS } from '.'

let cachedContext: Context | null = null
const TIMEOUT_OBSERVER = 10000

export const getCacheContext = () => {
  return cachedContext
}

export function setCacheContext(context: Context) {
  cachedContext = context
}

const verifyPendingImports = async () => {
  console.log('============================================')
  console.log('VERIFY PENDING IMPORTS ASYNC...')
  const context = getCacheContext()

  if (!context) {
    console.log('anyone import was triggered')

    return
  }

  const { importExecution, events } = context.clients

  const hasImportRunning = await importExecution
    .searchRaw(
      { page: 1, pageSize: 1 },
      ['id'],
      '',
      `status=${IMPORT_STATUS.RUNNING}`
    )
    .then(({ data }) => data.length > 0)

  if (hasImportRunning) {
    console.log('has import running...')

    return
  }

  const nextPendingImport = await importExecution
    .searchRaw(
      { page: 1, pageSize: 1 },
      IMPORT_EXECUTION_FIELDS,
      'createdIn asc',
      `status=${IMPORT_STATUS.PENDING}`
    )
    .then(({ data }) => data[0])

  if (!nextPendingImport) {
    console.log('no pending import...')

    return
  }

  console.log('has pending import:', nextPendingImport)

  await events.sendEvent('', 'runImport', nextPendingImport)
}

export const pendingImportsTimer = () =>
  setInterval(() => {
    verifyPendingImports().catch((e) => {
      console.log('pendingImportsTimer error')
      console.log(e.message)
    })
  }, TIMEOUT_OBSERVER)
