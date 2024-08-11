import { sequentialBatch, updateCurrentImport } from '../../helpers'

const handleStocks = async (context: AppEventContext) => {
  const { importEntity, sourceCatalog, targetCatalog } = context.clients
  const {
    id: executionImportId,
    settings = {},
    stocksOption = 'KEEP_SOURCE',
    stockValue,
    targetWarehouse,
  } = context.state.body

  const { entity, skuIds, mapSkus } = context.state
  const { account: sourceAccount } = settings

  if (!targetWarehouse || !skuIds?.length || !mapSkus) return

  const sourceStocks = await sourceCatalog.getInventories(skuIds)
  const sourceStocksTotal = sourceStocks.length

  await updateCurrentImport(context, { sourceStocksTotal })
  await sequentialBatch(sourceStocks, async (sourceStock) => {
    const { skuId, totalQuantity, hasUnlimitedQuantity, leadTime } = sourceStock

    const quantity =
      stocksOption === 'KEEP_SOURCE'
        ? totalQuantity
        : stocksOption === 'TO_BE_DEFINED'
        ? stockValue ?? 0
        : undefined

    const unlimitedQuantity =
      stocksOption === 'UNLIMITED' ||
      (hasUnlimitedQuantity && stocksOption === 'KEEP_SOURCE')

    const targetSku = mapSkus[+skuId]
    const payload = { quantity, unlimitedQuantity, leadTime }

    await targetCatalog.createInventory(targetSku, targetWarehouse, payload)
    await importEntity.save({
      executionImportId,
      name: entity,
      sourceAccount,
      sourceId: skuId,
      targetId: targetSku,
      payload,
      pathParams: { skus: targetSku, warehouses: targetWarehouse },
    })
  })
}

export default handleStocks
