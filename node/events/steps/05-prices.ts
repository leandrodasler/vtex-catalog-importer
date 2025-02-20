import {
  batch,
  DEFAULT_CONCURRENCY,
  FileManager,
  getEntityBySourceId,
  incrementVBaseEntity,
  promiseWithConditionalRetry,
  updateCurrentImport,
} from '../../helpers'

const handlePrices = async (context: AppEventContext) => {
  const {
    importEntity,
    importExecution,
    sourceCatalog,
    targetCatalog,
  } = context.clients

  const {
    id: executionImportId = '',
    settings = {},
    importPrices,
    currentIndex,
  } = context.state.body

  const { entity } = context.state

  const skuIdsFile = new FileManager(`skuIds-${executionImportId}`)

  const { account: sourceAccount } = settings

  if (!importPrices || !skuIdsFile.exists()) {
    return
  }

  const skuFile = new FileManager(`skus-${executionImportId}`)
  const priceDetailsFile = new FileManager(`priceDetails-${executionImportId}`)

  const sourcePricesTotal = priceDetailsFile.exists()
    ? context.state.body.sourcePricesTotal
    : await sourceCatalog.generatePriceDetailsFile(
        executionImportId,
        importExecution
      )

  if (!sourcePricesTotal || !priceDetailsFile.exists()) return

  const priceFile = new FileManager(`prices-${executionImportId}`)
  const sourceSkuSellerStockFile = new FileManager(
    `sourceSkuSellerStock-${executionImportId}`
  )

  if (!context.state.body.sourcePricesTotal) {
    await updateCurrentImport(context, { sourcePricesTotal })
  }

  const processPrice = async (sourcePrice: PriceDetails) => {
    const { itemId, basePrice, sellerStock, ...price } = sourcePrice
    const migrated = await getEntityBySourceId(context, itemId)

    if (migrated?.targetId) {
      priceFile.appendLine(`${itemId}=>${migrated.targetId}`)
    }

    const currentProcessed = await priceFile.findLine(itemId)

    if (currentProcessed) return

    const includeBasePrice = price.costPrice === null || price.markup === null
    const payload = { ...price, ...(includeBasePrice && { basePrice }) }
    const skuId = +((await skuFile.findLine(itemId)) ?? 0)

    if (sellerStock) {
      sourceSkuSellerStockFile.appendLine(`${itemId}=>${sellerStock}`)
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

    priceFile.appendLine(`${itemId}=>${skuId}`)
  }

  const priceDetailsLineIterator = priceDetailsFile.getLineIterator()
  let index = 1
  const taskQueue: Array<() => Promise<void>> = []

  for await (const line of priceDetailsLineIterator) {
    if (currentIndex && index < currentIndex) {
      index++
      continue
    }

    const price = JSON.parse(line)
    const task = async () => processPrice(price)

    taskQueue.push(task)

    if (taskQueue.length === DEFAULT_CONCURRENCY) {
      await batch(taskQueue.splice(0, taskQueue.length), (t) => t())
    }

    if (index % (DEFAULT_CONCURRENCY * 8) === 0 && index < sourcePricesTotal) {
      break
    }

    if (index < sourcePricesTotal) {
      index++
    }
  }

  if (taskQueue.length) {
    await batch(taskQueue, (t) => t())
  }

  if (index < sourcePricesTotal) {
    await updateCurrentImport(context, {
      entityEvent: 'price',
      currentIndex: index + 1,
    })
  } else {
    await updateCurrentImport(context, {
      entityEvent: 'stock',
      currentIndex: null,
    })
  }

  priceDetailsLineIterator.removeAllListeners()
  priceDetailsLineIterator.close()
}

export default handlePrices
