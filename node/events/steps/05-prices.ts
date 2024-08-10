import { sequentialBatch, updateCurrentImport } from '../../helpers'

const handlePrices = async (context: AppEventContext) => {
  const { importEntity, sourceCatalog, targetCatalog } = context.clients
  const { id: executionImportId, settings = {} } = context.state.body
  const { entity, skuIds, mapSkus } = context.state
  const { account: sourceAccount } = settings

  if (!skuIds?.length || !mapSkus) return
  const sourcePrices = await sourceCatalog.getPrices(skuIds)
  const sourcePricesTotal = sourcePrices.length

  await updateCurrentImport(context, { sourcePricesTotal })
  await sequentialBatch(sourcePrices, async (sourcePrice) => {
    const { itemId, basePrice, ...price } = sourcePrice
    const includeBasePrice = price.costPrice === null || price.markup === null
    const payload = { ...price, ...(includeBasePrice && { basePrice }) }
    const skuId = mapSkus[+itemId]

    await targetCatalog.createPrice(skuId, payload)
    await importEntity.save({
      executionImportId,
      name: entity,
      sourceAccount,
      sourceId: itemId,
      targetId: skuId,
      payload,
      pathParams: { prices: skuId },
    })
  })
}

export default handlePrices
