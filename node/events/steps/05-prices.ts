import {
  batch,
  DEFAULT_CONCURRENCY,
  FileManager,
  getEntityBySourceId,
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

  const { account: sourceAccount } = settings

  if (!importPrices) {
    await updateCurrentImport(context, {
      entityEvent: 'stock',
      currentIndex: null,
      lastId: null,
    })

    return
  }

  const skuFile = new FileManager(`skus-${executionImportId}`)

  if (!skuFile.exists()) {
    await updateCurrentImport(context, {
      entityEvent: 'sku',
      currentIndex: null,
    })

    return
  }

  const priceDetailsFile = new FileManager(`priceDetails-${executionImportId}`)

  if (!priceDetailsFile.exists() && currentIndex) {
    await updateCurrentImport(context, {
      entityEvent: 'price',
      currentIndex: null,
    })

    return
  }

  const sourcePricesTotal = priceDetailsFile.exists()
    ? await priceDetailsFile.getTotalLines()
    : await sourceCatalog.generatePriceDetailsFile(
        executionImportId,
        importExecution
      )

  if (!sourcePricesTotal || !priceDetailsFile.exists()) return

  const priceFile = new FileManager(`prices-${executionImportId}`)
  const sourceSkuSellerStockFile = new FileManager(
    `sourceSkuSellerStock-${executionImportId}`
  )

  await updateCurrentImport(context, { sourcePricesTotal })

  async function processPrice(sourcePrice: PriceDetails) {
    const { itemId, basePrice, sellerStock, ...price } = sourcePrice
    const migrated = await getEntityBySourceId(context, itemId)

    if (migrated?.targetId) {
      priceFile.appendLine(`${itemId}=>${migrated.targetId}`)
    }

    async function saveEntity({ targetId, payload }: SaveEntityArgs) {
      return importEntity
        .saveOrUpdate({
          id: `${executionImportId}-${entity}-${itemId}-${targetId}`,
          executionImportId,
          name: entity,
          sourceAccount,
          sourceId: itemId,
          targetId,
          payload,
          pathParams: { prices: targetId },
        })
        .catch((e) => {
          if (e.message.includes('304')) {
            return
          }

          throw e
        })
    }

    const currentProcessed = await priceFile.findLine(itemId)
    const includeBasePrice = price.costPrice === null || price.markup === null
    const payload = { ...price, ...(includeBasePrice && { basePrice }) }

    if (currentProcessed) {
      promiseWithConditionalRetry(saveEntity, {
        targetId: currentProcessed,
        payload,
      })

      return
    }

    const skuId = +((await skuFile.findLine(itemId)) ?? 0)

    if (sellerStock) {
      sourceSkuSellerStockFile.appendLine(`${itemId}=>${sellerStock}`)
    }

    await promiseWithConditionalRetry(function createPrice() {
      return targetCatalog.createPrice(skuId, payload)
    }, null)

    await Promise.all([
      promiseWithConditionalRetry(saveEntity, {
        targetId: skuId,
        payload,
      }),
      priceFile.appendLine(`${itemId}=>${skuId}`),
    ])
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
    const task = async function taskPrice() {
      await processPrice(price)
    }

    taskQueue.push(task)

    if (taskQueue.length === DEFAULT_CONCURRENCY) {
      await batch(taskQueue.splice(0, taskQueue.length), function taskPrice(t) {
        return t()
      })
    }

    if (index % (DEFAULT_CONCURRENCY * 8) === 0 && index < sourcePricesTotal) {
      break
    }

    if (index < sourcePricesTotal) {
      index++
    }
  }

  if (taskQueue.length) {
    await batch(taskQueue, function taskPrice(t) {
      return t()
    })
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
