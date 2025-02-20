import { setCurrentImportId } from '..'
import {
  batch,
  DEFAULT_CONCURRENCY,
  deleteImportFiles,
  FileManager,
  getEntityBySourceId,
  IMPORT_STATUS,
  incrementVBaseEntity,
  promiseWithConditionalRetry,
  updateCurrentImport,
} from '../../helpers'

const handleStocks = async (context: AppEventContext) => {
  const {
    importEntity,
    importExecution,
    sourceCatalog,
    targetCatalog,
  } = context.clients

  const {
    id: executionImportId = '',
    settings = {},
    stocksOption = 'KEEP_SOURCE',
    stockValue,
    targetWarehouse,
    currentIndex,
  } = context.state.body

  const { entity } = context.state
  const { account: sourceAccount } = settings
  const skuIdsFile = new FileManager(`skuIds-${executionImportId}`)
  const skuFile = new FileManager(`skus-${executionImportId}`)

  if (!targetWarehouse || !skuIdsFile.exists() || !skuFile.exists()) {
    return
  }

  const inventoryDetailsFile = new FileManager(
    `inventoryDetails-${executionImportId}`
  )

  const sourceStocksTotal = inventoryDetailsFile.exists()
    ? context.state.body.sourceStocksTotal
    : await sourceCatalog.generateInventoryDetailsFile(
        executionImportId,
        importExecution
      )

  if (!sourceStocksTotal || !inventoryDetailsFile.exists()) return

  const stockMapFile = new FileManager(`stockMap-${executionImportId}`)

  if (!context.state.body.sourceStocksTotal) {
    await updateCurrentImport(context, { sourceStocksTotal })
  }

  const processStock = async (sourceStock: SkuInventory) => {
    const { skuId, totalQuantity, hasUnlimitedQuantity, leadTime } = sourceStock
    const migrated = await getEntityBySourceId(context, skuId)

    if (migrated?.targetId) {
      stockMapFile.appendLine(`${skuId}=>${migrated.targetId}`)
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

    stockMapFile.appendLine(`${skuId}=>${targetSku}`)
  }

  const inventoryDetailsLineIterator = inventoryDetailsFile.getLineIterator()
  let index = 1
  const taskQueue: Array<() => Promise<void>> = []

  for await (const line of inventoryDetailsLineIterator) {
    if (currentIndex && index < currentIndex) {
      index++
      continue
    }

    const inventory = JSON.parse(line)
    const task = async () => processStock(inventory)

    taskQueue.push(task)

    if (taskQueue.length === DEFAULT_CONCURRENCY) {
      await batch(taskQueue.splice(0, taskQueue.length), (t) => t())
    }

    if (index % (DEFAULT_CONCURRENCY * 8) === 0 && index < sourceStocksTotal) {
      break
    }

    if (index < sourceStocksTotal) {
      index++
    }
  }

  if (taskQueue.length) {
    await batch(taskQueue, (t) => t())
  }

  if (index < sourceStocksTotal) {
    await updateCurrentImport(context, {
      entityEvent: 'stock',
      currentIndex: index + 1,
    })
  } else {
    await updateCurrentImport(context, {
      status: IMPORT_STATUS.SUCCESS,
      currentEntity: null,
    })

    setCurrentImportId(null)

    deleteImportFiles(executionImportId)
  }

  inventoryDetailsLineIterator.removeAllListeners()
  inventoryDetailsLineIterator.close()
}

export default handleStocks
