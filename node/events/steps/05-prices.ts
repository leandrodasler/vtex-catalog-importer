import {
  FileManager,
  getEntityBySourceId,
  incrementVBaseEntity,
  promiseWithConditionalRetry,
  updateCurrentImport,
} from '../../helpers'

const handlePrices = async (context: AppEventContext) => {
  const { importEntity, sourceCatalog, targetCatalog } = context.clients
  const {
    id: executionImportId = '',
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

  const sourcePricesTotal = await sourceCatalog.generatePriceDetailsFile(
    executionImportId
  )

  const priceDetailsFile = new FileManager(`priceDetails-${executionImportId}`)

  if (!priceDetailsFile.exists()) return

  const priceFile = new FileManager(`prices-${executionImportId}`)
  const priceFileWriteStream = priceFile.getWriteStream()
  const sourceSkuSellerStockFile = new FileManager(
    `sourceSkuSellerStock-${executionImportId}`
  )

  const sourceSkuSellerStockFileWriteStream = sourceSkuSellerStockFile.getWriteStream()

  await updateCurrentImport(context, { sourcePricesTotal })

  const processPrice = async (sourcePrice: PriceDetails) => {
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
  }

  const priceDetailsLineIterator = priceDetailsFile.getLineIterator()

  const MAX_CONCURRENT_TASKS = 10
  const taskQueue: Array<Promise<void>> = []

  for await (const line of priceDetailsLineIterator) {
    const price = JSON.parse(line)

    // eslint-disable-next-line no-loop-func
    const task = (async () => {
      await processPrice(price)
    })()

    taskQueue.push(task)

    if (taskQueue.length >= MAX_CONCURRENT_TASKS) {
      await Promise.race(taskQueue)
      taskQueue.splice(0, taskQueue.findIndex((t) => t === task) + 1)
    }
  }

  await Promise.all(taskQueue)

  priceFileWriteStream.end()
  sourceSkuSellerStockFileWriteStream.end()
}

export default handlePrices
