import { UserInputError } from '@vtex/api'

import { setCurrentImportId } from '..'
import {
  batch,
  DEFAULT_CONCURRENCY,
  FileManager,
  getEntityBySourceId,
  IMPORT_STATUS,
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
    targetWarehouse = '',
    currentIndex,
  } = context.state.body

  const { entity } = context.state
  const { account: sourceAccount } = settings
  const skuFile = new FileManager(`skus-${executionImportId}`)

  if (!targetWarehouse) {
    throw new UserInputError('Target warehouse is missing')
  }

  if (!skuFile.exists()) {
    await updateCurrentImport(context, {
      entityEvent: 'sku',
      currentIndex: null,
    })

    return
  }

  const inventoryDetailsFile = new FileManager(
    `inventoryDetails-${executionImportId}`
  )

  if (!inventoryDetailsFile.exists() && currentIndex) {
    await updateCurrentImport(context, {
      entityEvent: 'stock',
      currentIndex: null,
    })

    return
  }

  const sourceStocksTotal = inventoryDetailsFile.exists()
    ? await inventoryDetailsFile.getTotalLines()
    : await sourceCatalog.generateInventoryDetailsFile(
        executionImportId,
        importExecution
      )

  if (!sourceStocksTotal || !inventoryDetailsFile.exists()) return

  const stockMapFile = new FileManager(`stockMap-${executionImportId}`)

  await updateCurrentImport(context, { sourceStocksTotal })

  async function processStock(sourceStock: SkuInventory) {
    const { skuId, totalQuantity, hasUnlimitedQuantity, leadTime } = sourceStock
    const migrated = await getEntityBySourceId(context, skuId)

    if (migrated?.targetId) {
      stockMapFile.appendLine(`${skuId}=>${migrated.targetId}`)
    }

    async function saveEntity({ targetId, payload }: SaveEntityArgs) {
      return importEntity
        .saveOrUpdate({
          id: `${executionImportId}-${entity}-${skuId}-${targetId}`,
          executionImportId,
          name: entity,
          sourceAccount,
          sourceId: skuId,
          targetId,
          payload,
          pathParams: { skus: targetId, warehouses: targetWarehouse },
        })
        .catch((e) => {
          if (e.message.includes('304')) {
            return
          }

          throw e
        })
    }

    const currentProcessed = await stockMapFile.findLine(skuId)
    const quantity =
      stocksOption === 'KEEP_SOURCE'
        ? totalQuantity
        : stocksOption === 'TO_BE_DEFINED'
        ? stockValue ?? 0
        : undefined

    const unlimitedQuantity =
      stocksOption === 'UNLIMITED' ||
      (hasUnlimitedQuantity && stocksOption === 'KEEP_SOURCE')

    const payload = { quantity, unlimitedQuantity, leadTime }

    if (currentProcessed) {
      promiseWithConditionalRetry(saveEntity, {
        targetId: currentProcessed,
        payload,
      })

      return
    }

    const targetSku = +((await skuFile.findLine(skuId)) ?? 0)

    await promiseWithConditionalRetry(function createInventory() {
      return targetCatalog.createInventory(targetSku, targetWarehouse, payload)
    }, null)

    await Promise.all([
      promiseWithConditionalRetry(saveEntity, {
        targetId: targetSku,
        payload,
      }),
      stockMapFile.appendLine(`${skuId}=>${targetSku}`),
    ])
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
    const task = async function taskStock() {
      await processStock(inventory)
    }

    taskQueue.push(task)

    if (taskQueue.length === DEFAULT_CONCURRENCY) {
      await batch(taskQueue.splice(0, taskQueue.length), function taskStock(t) {
        return t()
      })
    }

    if (index % (DEFAULT_CONCURRENCY * 8) === 0 && index < sourceStocksTotal) {
      break
    }

    if (index < sourceStocksTotal) {
      index++
    }
  }

  if (taskQueue.length) {
    await batch(taskQueue, function taskStock(t) {
      return t()
    })
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

    // PS: do not delete files in order to analyze the results of the imports
    // deleteImportFiles(executionImportId)
  }

  inventoryDetailsLineIterator.removeAllListeners()
  inventoryDetailsLineIterator.close()
}

export default handleStocks
