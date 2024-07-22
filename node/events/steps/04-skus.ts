import { delay, updateCurrentImport } from '../../helpers'

const handleSkus = async (context: AppEventContext) => {
  // TODO: process skus import
  const { importEntity } = context.clients
  const { id = '', settings = {} } = context.state.body
  const { entity } = context.state
  const { account: sourceAccount } = settings
  const sourceSkusTotal = 3

  await updateCurrentImport(context, { sourceSkusTotal: 3 })

  for (let i = 1; i <= sourceSkusTotal; i++) {
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

export default handleSkus
