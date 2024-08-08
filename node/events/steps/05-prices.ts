import { sequentialBatch, updateCurrentImport } from '../../helpers'

const handlePrices = async (context: AppEventContext) => {
  // TODO: process prices import
  const { importEntity, sourceCatalog, targetCatalog } = context.clients
  const { id: executionImportId, settings = {} } = context.state.body
  const { entity, skuIds, mapSkus } = context.state
  const { account: sourceAccount } = settings

  if (!skuIds?.length) return
  const sourcePrices = await sourceCatalog.getPrices(skuIds)
  const sourcePricesTotal = sourcePrices.length

  await updateCurrentImport(context, { sourcePricesTotal })

  await sequentialBatch(sourcePrices, async ({ itemId, ...price }) => {
    const payload = { ...price }

    const skuId = mapSkus?.[+itemId]

    if (!skuId) return
    const { Id: targetId } = await targetCatalog.createPrice(skuId, payload)

    await importEntity.save({
      executionImportId,
      name: entity,
      sourceAccount,
      sourceId: itemId,
      targetId,
      payload,
    })
  })
}

export default handlePrices
