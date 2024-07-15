/* eslint-disable no-console */

import { delay, handleError, printImport, updateImport } from '../../helpers'

const handleCategories = async (context: AppEventContext) => {
  try {
    if (context.state.body.error) return

    context.state.step = 'categories'
    printImport(context)
    // TODO: process categories import
    const { importEntity } = context.clients
    const { id = '', settings = {} } = context.state.body

    await updateImport(context, { sourceCategoriesTotal: 3 })

    await delay(1000)
    await importEntity.save({
      executionImportId: id,
      name: 'category',
      sourceAccount: settings.account ?? '',
      sourceId: '1',
      payload: { name: 'category 1' },
    })

    await delay(1000)
    await importEntity.save({
      executionImportId: id,
      name: 'category',
      sourceAccount: settings.account ?? '',
      sourceId: '2',
      payload: { name: 'category 2' },
    })

    await delay(1000)
    await importEntity.save({
      executionImportId: id,
      name: 'category',
      sourceAccount: settings.account ?? '',
      sourceId: '3',
      payload: { name: 'category 3' },
    })
  } catch (error) {
    await handleError(context, error)
  }
}

export default handleCategories
