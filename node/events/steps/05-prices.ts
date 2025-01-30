import {
  batch,
  FileManager,
  getEntityBySourceId,
  incrementVBaseEntity,
  promiseWithConditionalRetry,
  updateCurrentImport,
} from '../../helpers'

const handlePrices = async (context: AppEventContext) => {
  const { importEntity, sourceCatalog, targetCatalog } = context.clients
  const {
    id: executionImportId,
    settings = {},
    importPrices,
  } = context.state.body

  const {
    entity /* , skuIds */ /* mapSku, mapSourceSkuProduct */,
  } = context.state

  const skuIdsFile = new FileManager(`skuIds-${executionImportId}`)

  const { account: sourceAccount } = settings

  if (
    !importPrices ||
    !skuIdsFile.exists()
    // !skuIds?.length /* || !mapSku || !mapSourceSkuProduct */
  ) {
    return
  }

  const skuFile = new FileManager(`skus-${executionImportId}`)
  const sourceSkuProductFile = new FileManager(
    `sourceSkuProduct-${executionImportId}`
  )

  const sourcePrices = await sourceCatalog.getPrices(
    skuIdsFile,
    sourceSkuProductFile
  )

  const sourcePricesTotal = sourcePrices.length
  // const mapPrice: EntityMap = {}
  const priceFile = new FileManager(`prices-${executionImportId}`)
  // const mapSourceSkuSellerStock: EntityMap = {}
  const sourceSkuSellerStockFile = new FileManager(
    `sourceSkuSellerStock-${executionImportId}`
  )

  await updateCurrentImport(context, { sourcePricesTotal })
  await batch(sourcePrices, async (sourcePrice) => {
    const { itemId, basePrice, sellerStock, ...price } = sourcePrice
    const migrated = await getEntityBySourceId(context, itemId)

    if (migrated?.targetId) {
      // mapPrice[+itemId] = +migrated.targetId
      priceFile.append(`${itemId}=>${migrated.targetId}\n`)
    }

    // if (mapPrice[+itemId]) return
    const currentProcessed = await priceFile.findLine(itemId)

    if (currentProcessed) return

    const includeBasePrice = price.costPrice === null || price.markup === null
    const payload = { ...price, ...(includeBasePrice && { basePrice }) }
    const skuId = +((await skuFile.findLine(itemId)) ?? 0) // mapSku[+itemId]

    if (sellerStock) {
      // mapSourceSkuSellerStock[+itemId] = sellerStock
      sourceSkuSellerStockFile.append(`${itemId}=>${sellerStock}\n`)
    }

    await promiseWithConditionalRetry(
      () => targetCatalog.createPrice(skuId, payload),
      null
    )

    await promiseWithConditionalRetry(
      () =>
        importEntity.save({
          executionImportId,
          name: entity,
          sourceAccount,
          sourceId: itemId,
          targetId: skuId,
          payload,
          pathParams: { prices: skuId },
        }),
      null
    ).catch(() => incrementVBaseEntity(context))

    // mapPrice[+itemId] = skuId
    priceFile.append(`${itemId}=>${skuId}\n`)
  })

  // context.state.mapSourceSkuSellerStock = mapSourceSkuSellerStock
  // context.state.mapSourceSkuProduct = undefined
}

export default handlePrices
