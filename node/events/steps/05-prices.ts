import {
  getEntityBySourceId,
  incrementVBaseEntity,
  sequentialBatch,
  updateCurrentImport,
} from '../../helpers'

const handlePrices = async (context: AppEventContext) => {
  const { importEntity, sourceCatalog, targetCatalog } = context.clients
  const {
    id: executionImportId,
    settings = {},
    importPrices,
  } = context.state.body

  const { entity, skuIds, mapSku, mapSourceSkuProduct } = context.state
  const { account: sourceAccount } = settings

  if (!importPrices || !skuIds?.length || !mapSku || !mapSourceSkuProduct) {
    return
  }

  const sourcePrices = await sourceCatalog.getPrices(
    skuIds,
    mapSourceSkuProduct
  )

  const sourcePricesTotal = sourcePrices.length
  const mapPrice: EntityMap = {}
  const mapSourceSkuSellerStock: EntityMap = {}

  await updateCurrentImport(context, { sourcePricesTotal })
  await sequentialBatch(sourcePrices, async (sourcePrice) => {
    const { itemId, basePrice, sellerStock, ...price } = sourcePrice
    const migrated = await getEntityBySourceId(context, itemId)

    if (migrated?.targetId) {
      mapPrice[+itemId] = +migrated.targetId
    }

    if (mapPrice[+itemId]) {
      return
    }

    const includeBasePrice = price.costPrice === null || price.markup === null
    const payload = { ...price, ...(includeBasePrice && { basePrice }) }
    const skuId = mapSku[+itemId]

    if (sellerStock) {
      mapSourceSkuSellerStock[+itemId] = sellerStock
    }

    await targetCatalog.createPrice(skuId, payload)
    await importEntity
      .save({
        executionImportId,
        name: entity,
        sourceAccount,
        sourceId: itemId,
        targetId: skuId,
        payload,
        pathParams: { prices: skuId },
      })
      .catch(() => incrementVBaseEntity(context))

    mapPrice[+itemId] = skuId
  })

  context.state.mapSourceSkuSellerStock = mapSourceSkuSellerStock
}

export default handlePrices
