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

  const { entity } = context.state

  const skuIdsFile = new FileManager(`skuIds-${executionImportId}`)

  const { account: sourceAccount } = settings

  if (!importPrices || !skuIdsFile.exists()) {
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
  const priceFile = new FileManager(`prices-${executionImportId}`)
  const priceFileWriteStream = priceFile.getWriteStream()
  const sourceSkuSellerStockFile = new FileManager(
    `sourceSkuSellerStock-${executionImportId}`
  )

  const sourceSkuSellerStockFileWriteStream = sourceSkuSellerStockFile.getWriteStream()

  await updateCurrentImport(context, { sourcePricesTotal })
  await batch(sourcePrices, async (sourcePrice) => {
    const { itemId, basePrice, sellerStock, ...price } = sourcePrice
    const migrated = await getEntityBySourceId(context, itemId)

    if (migrated?.targetId) {
      priceFileWriteStream.write(`${itemId}=>${migrated.targetId}\n`)
    }

    const currentProcessed = await priceFile.findLine(itemId)

    if (currentProcessed) return

    const includeBasePrice = price.costPrice === null || price.markup === null
    const payload = { ...price, ...(includeBasePrice && { basePrice }) }
    const skuId = +((await skuFile.findLine(itemId)) ?? 0)

    if (sellerStock) {
      sourceSkuSellerStockFileWriteStream.write(`${itemId}=>${sellerStock}\n`)
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

    priceFileWriteStream.write(`${itemId}=>${skuId}\n`)
  })

  priceFileWriteStream.end()
  sourceSkuSellerStockFileWriteStream.end()
}

export default handlePrices
