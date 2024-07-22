import { delay, updateCurrentImport } from '../../helpers'

const handleProducts = async (context: AppEventContext) => {
  // TODO: process products import
  const { importEntity } = context.clients
  const { id = '', settings = {} } = context.state.body
  const { entity } = context.state
  const { account: sourceAccount } = settings
  const sourceProductsTotal = 5

  await updateCurrentImport(context, { sourceProductsTotal })

  for (let i = 1; i <= sourceProductsTotal; i++) {
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

export default handleProducts
