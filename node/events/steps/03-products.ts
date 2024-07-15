/* eslint-disable no-console */

import { delay, handleError, printImport, updateImport } from '../../helpers'

const handleProducts = async (context: AppEventContext) => {
  try {
    if (context.state.body.error) return

    context.state.step = 'products'
    printImport(context)
    // TODO: process products import
    const { importEntity } = context.clients
    const { id = '', settings = {} } = context.state.body

    await updateImport(context, { sourceProductsTotal: 5 })

    await delay(1000)
    await importEntity.save({
      executionImportId: id,
      name: 'product',
      sourceAccount: settings.account ?? '',
      sourceId: '1',
      payload: { name: 'product 1' },
    })

    await delay(1000)
    await importEntity.save({
      executionImportId: id,
      name: 'product',
      sourceAccount: settings.account ?? '',
      sourceId: '2',
      payload: { name: 'product 2' },
    })

    await delay(1000)
    await importEntity.save({
      executionImportId: id,
      name: 'product',
      sourceAccount: settings.account ?? '',
      sourceId: '3',
      payload: { name: 'product 3' },
    })

    await delay(1000)
    await importEntity.save({
      executionImportId: id,
      name: 'product',
      sourceAccount: settings.account ?? '',
      sourceId: '4',
      payload: { name: 'product 4' },
    })

    await delay(1000)
    await importEntity.save({
      executionImportId: id,
      name: 'product',
      sourceAccount: settings.account ?? '',
      sourceId: '5',
      payload: { name: 'product 5' },
    })
  } catch (error) {
    await handleError(context, error)
  }
}

export default handleProducts
