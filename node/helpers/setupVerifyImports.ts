/* eslint-disable no-console */
import {
  deleteImport,
  getFirstImportPending,
  getFirstImportProcessing,
  getFirstImportToBeDeleted,
  ONE_RESULT,
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

  /** ************** TODO: remove this */
  context?.clients.importExecution
    .searchRaw({ page: 1, pageSize: 10 }, ['id', 'status'], 'createdIn desc')
    .then(({ data: imports, pagination: { total: totalImports } }) => {
      console.log('>>')
      console.log('===========================')
      console.log('LAST 10 IMPORT EXECUTIONS')
      console.log({ totalImports })
      imports.forEach((each) => console.log(each))

      context.clients.importEntity
        .searchRaw(
          ONE_RESULT,
          [
            'id',
            'executionImportId',
            'sourceAccount',
            'name',
            'sourceId',
            'targetId',
            'payload',
          ],
          'createdIn desc'
        )
        .then(({ data: entities, pagination: { total: totalEntities } }) => {
          console.log('---------------------------')
          console.log('LAST IMPORT ENTITY')
          console.log({ totalEntities })
          entities.forEach((each) => console.log(each))
          console.log('===========================\n<<')
        })
    })
  /** ************** */

  if (!context || (await getFirstImportProcessing(context))) return
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
