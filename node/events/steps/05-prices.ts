import { delay, updateCurrentImport } from '../../helpers'

const handlePrices = async (context: AppEventContext) => {
  // TODO: process prices import
  const { importEntity } = context.clients
  const { id, settings = {} } = context.state.body
  const { entity } = context.state
  const { account: sourceAccount } = settings
  const sourcePricesTotal = 3

  await updateCurrentImport(context, { sourcePricesTotal: 3 })

  for (let i = 1; i <= sourcePricesTotal; i++) {
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

export default handlePrices
