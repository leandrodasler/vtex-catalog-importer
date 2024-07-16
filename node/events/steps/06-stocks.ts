/* eslint-disable no-console */
import { delay, IMPORT_STATUS, updateImport } from '../../helpers'

const handleStocks = async (context: AppEventContext) => {
  // TODO: process stocks import
  const { importEntity } = context.clients
  const { id = '', settings = {} } = context.state.body

  await updateImport(context, { sourceStocksTotal: 3 })

  await delay(1000)
  await importEntity.save({
    executionImportId: id,
    name: context.state.entity,
    sourceAccount: settings.account ?? '',
    sourceId: '1',
    payload: { name: `${context.state.entity} 1` },
  })

  await delay(1000)
  await importEntity.save({
    executionImportId: id,
    name: context.state.entity,
    sourceAccount: settings.account ?? '',
    sourceId: '2',
    payload: { name: `${context.state.entity} 2` },
  })

  await delay(1000)
  await importEntity.save({
    executionImportId: id,
    name: context.state.entity,
    sourceAccount: settings.account ?? '',
    sourceId: '3',
    payload: { name: `${context.state.entity} 3` },
  })

  await delay(1000)
  await updateImport(context, { status: IMPORT_STATUS.SUCCESS })

  console.log('========================')
  console.log('FINISHED IMPORT')
  console.log(context.state.body)
}

export default handleStocks
