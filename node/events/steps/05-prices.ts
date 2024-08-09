import { sequentialBatch, updateCurrentImport } from '../../helpers'

const handlePrices = async (context: AppEventContext) => {
  const { importEntity, sourceCatalog, targetCatalog } = context.clients
  const { id: executionImportId, settings = {} } = context.state.body
  const { entity, skuIds, mapSkus } = context.state
  const { account: sourceAccount } = settings

  if (!skuIds?.length) return
  const sourcePrices = await sourceCatalog.getPrices(skuIds)
  const sourcePricesTotal = sourcePrices.length

  await updateCurrentImport(context, { sourcePricesTotal })

  await sequentialBatch(sourcePrices, async (sourcePrice) => {
    const { itemId, basePrice, ...price } = sourcePrice
    const payload = {
      ...price,
      ...(!price.costPrice && basePrice && { basePrice }),
    }

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
