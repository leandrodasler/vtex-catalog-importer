import { setCurrentImportId } from '..'
import {
  FileManager,
  getEntityBySourceId,
  IMPORT_STATUS,
  incrementVBaseEntity,
  promiseWithConditionalRetry,
  updateCurrentImport,
} from '../../helpers'

const handleStocks = async (context: AppEventContext) => {
  const { importEntity, sourceCatalog, targetCatalog } = context.clients
  const {
    id: executionImportId = '',
    settings = {},
    stocksOption = 'KEEP_SOURCE',
    stockValue,
    targetWarehouse,
  } = context.state.body

  const { entity } = context.state
  const { account: sourceAccount } = settings
  const skuIdsFile = new FileManager(`skuIds-${executionImportId}`)
  const skuFile = new FileManager(`skus-${executionImportId}`)
  const sourceSkuSellerStockFile = new FileManager(
    `sourceSkuSellerStock-${executionImportId}`
  )

  if (!targetWarehouse || !skuIdsFile.exists() || !skuFile.exists()) {
    return
  }

  const sourceStocksTotal = await sourceCatalog.generateInventoryDetailsFile(
    executionImportId
  )

  const inventoryDetailsFile = new FileManager(
    `inventoryDetails-${executionImportId}`
  )

  if (!inventoryDetailsFile.exists()) return

  const stockMapFile = new FileManager(`stockMap-${executionImportId}`)
  const stockMapFileWriteStream = stockMapFile.getWriteStream()

  await updateCurrentImport(context, { sourceStocksTotal })

  const processStock = async (sourceStock: SkuInventory) => {
    const { skuId, totalQuantity, hasUnlimitedQuantity, leadTime } = sourceStock
    const migrated = await getEntityBySourceId(context, skuId)

    if (migrated?.targetId) {
      stockMapFileWriteStream.write(`${skuId}=>${migrated.targetId}\n`)
    }

    const currentProcessed = await stockMapFile.findLine(skuId)

    if (currentProcessed) return

    const quantity =
      stocksOption === 'KEEP_SOURCE'
        ? totalQuantity
        : stocksOption === 'TO_BE_DEFINED'
        ? stockValue ?? 0
        : undefined

    const unlimitedQuantity =
      stocksOption === 'UNLIMITED' ||
      (hasUnlimitedQuantity && stocksOption === 'KEEP_SOURCE')

    const targetSku = +((await skuFile.findLine(skuId)) ?? 0)
    const payload = { quantity, unlimitedQuantity, leadTime }

    await promiseWithConditionalRetry(
      () => targetCatalog.createInventory(targetSku, targetWarehouse, payload),
      null
    )

    await promiseWithConditionalRetry(
      () =>
        importEntity.save({
          executionImportId,
          name: entity,
          sourceAccount,
          sourceId: skuId,
          targetId: targetSku,
          payload,
          pathParams: { skus: targetSku, warehouses: targetWarehouse },
        }),
      null
    ).catch(() => incrementVBaseEntity(context))
    stockMapFileWriteStream.write(`${skuId}=>${targetSku}\n`)
  }

  const inventoryDetailsLineIterator = inventoryDetailsFile.getLineIterator()

  const MAX_CONCURRENT_TASKS = 10
  const taskQueue: Array<Promise<void>> = []

  for await (const line of inventoryDetailsLineIterator) {
    const inventory = JSON.parse(line)

    // eslint-disable-next-line no-loop-func
    const task = (async () => {
      await processStock(inventory)
    })()

    taskQueue.push(task)

    if (taskQueue.length >= MAX_CONCURRENT_TASKS) {
      await Promise.race(taskQueue)
      taskQueue.splice(0, taskQueue.findIndex((t) => t === task) + 1)
    }
  }

  await Promise.all(taskQueue)

  stockMapFileWriteStream.end()

  await updateCurrentImport(context, {
    status: IMPORT_STATUS.SUCCESS,
    currentEntity: null,
  })

  setCurrentImportId(null)

  const categoryFile = new FileManager(`categories-${executionImportId}`)
  const productFile = new FileManager(`products-${executionImportId}`)
  const productDetailsFile = new FileManager(
    `productDetails-${executionImportId}`
  )

  const skuDetailsFile = new FileManager(`skuDetails-${executionImportId}`)
  const priceFile = new FileManager(`prices-${executionImportId}`)

  const sourceSkuProductFile = new FileManager(
    `sourceSkuProduct-${executionImportId}`
  )

  const priceDetailsFile = new FileManager(`priceDetails-${executionImportId}`)

  categoryFile.delete()
  productFile.delete()
  productDetailsFile.delete()
  sourceSkuProductFile.delete()
  priceFile.delete()
  skuFile.delete()
  skuIdsFile.delete()
  sourceSkuSellerStockFile.delete()
  skuDetailsFile.delete()
  priceDetailsFile.delete()
  inventoryDetailsFile.delete()
  stockMapFile.delete()
}

export default handleStocks
