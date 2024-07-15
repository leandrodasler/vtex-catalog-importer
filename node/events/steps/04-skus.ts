/* eslint-disable no-console */

import { delay, handleError, printImport, updateImport } from '../../helpers'

const handleSkus = async (context: AppEventContext) => {
  try {
    if (context.state.body.error) return

    context.state.step = 'skus'
    printImport(context)
    // TODO: process skus import
    const { importEntity } = context.clients
    const { id = '', settings = {} } = context.state.body

    await updateImport(context, { sourceSkusTotal: 3 })

    await delay(1000)
    await importEntity.save({
      executionImportId: id,
      name: 'sku',
      sourceAccount: settings.account ?? '',
      sourceId: '1',
      payload: { name: 'sku 1' },
    })

    await delay(1000)
    await importEntity.save({
      executionImportId: id,
      name: 'sku',
      sourceAccount: settings.account ?? '',
      sourceId: '2',
      payload: { name: 'sku 2' },
    })

    await delay(1000)
    await importEntity.save({
      executionImportId: id,
      name: 'sku',
      sourceAccount: settings.account ?? '',
      sourceId: '3',
      payload: { name: 'sku 3' },
    })
  } catch (error) {
    await handleError(context, error)
  }
}

export default handleSkus
