/* eslint-disable no-console */

import { delay, handleError, printImport, updateImport } from '../../helpers'

const handlePrices = async (context: AppEventContext) => {
  try {
    if (context.state.body.error) return

    context.state.step = 'prices'
    printImport(context)
    // TODO: process prices import
    const { importEntity } = context.clients
    const { id = '', settings = {} } = context.state.body

    await updateImport(context, { sourcePricesTotal: 3 })

    await delay(1000)
    await importEntity.save({
      executionImportId: id,
      name: 'price',
      sourceAccount: settings.account ?? '',
      sourceId: '1',
      payload: { name: 'price 1' },
    })

    await delay(1000)
    await importEntity.save({
      executionImportId: id,
      name: 'price',
      sourceAccount: settings.account ?? '',
      sourceId: '2',
      payload: { name: 'price 2' },
    })

    await delay(1000)
    await importEntity.save({
      executionImportId: id,
      name: 'price',
      sourceAccount: settings.account ?? '',
      sourceId: '3',
      payload: { name: 'price 3' },
    })
  } catch (error) {
    await handleError(context, error)
  }
}

export default handlePrices
