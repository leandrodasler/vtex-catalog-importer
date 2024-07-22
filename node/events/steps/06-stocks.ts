/* eslint-disable no-console */
import { delay, updateCurrentImport } from '../../helpers'

const handleStocks = async (context: AppEventContext) => {
  // TODO: process stocks import
  const { importEntity } = context.clients
  const { id, settings = {} } = context.state.body
  const { entity } = context.state
  const { account: sourceAccount } = settings
  const sourceStocksTotal = 3

  await updateCurrentImport(context, { sourceStocksTotal: 3 })

  for (let i = 1; i <= sourceStocksTotal; i++) {
    // eslint-disable-next-line no-await-in-loop
    await delay(1000)
    // eslint-disable-next-line no-await-in-loop
    await importEntity.save({
      executionImportId: id,
      name: entity,
      sourceAccount,
      sourceId: i,
      payload: { name: `${context.state.entity} ${i}` },
    })
  }
}

export default handleStocks
