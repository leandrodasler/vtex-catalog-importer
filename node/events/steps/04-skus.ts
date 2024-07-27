const handleSkus = async (context: AppEventContext) => {
  // TODO: process skus import
  const { importEntity } = context.clients
  const { id, settings = {} } = context.state.body
  const { entity, skuIds = [] } = context.state
  const { account: sourceAccount } = settings

  if (!skuIds.length) {
    return
  }

  for (let i = 1; i <= skuIds.length; i++) {
    // eslint-disable-next-line no-await-in-loop
    await importEntity.save({
      executionImportId: id,
      name: entity,
      sourceAccount,
      sourceId: i,
      payload: { name: `${entity} ${i}` },
    })
  }
}

export default handleSkus
