/* eslint-disable no-console */

import {
  delay,
  handleError,
  IMPORT_STATUS,
  printImport,
  updateImport,
} from '../../helpers'

const handleStocks = async (context: AppEventContext) => {
  try {
    if (context.state.body.error) return

    context.state.step = 'stocks'
    printImport(context)
    // TODO: process stocks import
    const { importEntity } = context.clients
    const { id = '', settings = {} } = context.state.body

    await updateImport(context, { sourceStocksTotal: 3 })

    await delay(1000)
    await importEntity.save({
      executionImportId: id,
      name: 'stock',
      sourceAccount: settings.account ?? '',
      sourceId: '1',
      payload: { name: 'stock 1' },
    })

    await delay(1000)
    await importEntity.save({
      executionImportId: id,
      name: 'stock',
      sourceAccount: settings.account ?? '',
      sourceId: '2',
      payload: { name: 'stock 2' },
    })

    await delay(1000)
    await importEntity.save({
      executionImportId: id,
      name: 'stock',
      sourceAccount: settings.account ?? '',
      sourceId: '3',
      payload: { name: 'stock 3' },
    })

    await updateImport(context, { status: IMPORT_STATUS.SUCCESS })

    console.log('========================')
    console.log('FINISHED IMPORT')
    console.log(context.state.body)
  } catch (error) {
    await handleError(context, error)
  }
}

export default handleStocks
