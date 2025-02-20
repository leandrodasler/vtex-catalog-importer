import {
  batch,
  DEFAULT_CONCURRENCY,
  FileManager,
  getEntityBySourceId,
  incrementVBaseEntity,
  promiseWithConditionalRetry,
  updateCurrentImport,
} from '../../helpers'

const handleSkus = async (context: AppEventContext) => {
  const { entity } = context.state
  const {
    sourceCatalog,
    targetCatalog,
    importEntity,
    importExecution,
  } = context.clients

  const {
    id: executionImportId = '',
    settings = {},
    importImages = true,
    currentIndex,
    lastId,
  } = context.state.body

  const productFile = new FileManager(`products-${executionImportId}`)

  if (!productFile.exists()) return

  const { account: sourceAccount } = settings

  const skuDetailsFile = new FileManager(`skuDetails-${executionImportId}`)

  const sourceSkusTotal = skuDetailsFile.exists()
    ? context.state.body.sourceSkusTotal
    : await sourceCatalog.generateSkuDetailsFiles(
        executionImportId,
        importExecution
      )

  if (!sourceSkusTotal || !skuDetailsFile.exists()) return

  const skuFile = new FileManager(`skus-${executionImportId}`)
  const sourceSkuProductFile = new FileManager(
    `sourceSkuProduct-${executionImportId}`
  )

  if (!context.state.body.sourceSkusTotal) {
    await updateCurrentImport(context, { sourceSkusTotal })
  }

  const processSku = async ({ Id, newId, RefId, ...sku }: SkuDetails) => {
    const migrated = await getEntityBySourceId(context, Id)

    if (migrated?.targetId) {
      skuFile.appendLine(`${Id}=>${migrated.targetId}`)
    }

    const currentProcessed = await skuFile.findLine(Id)

    if (currentProcessed) return +currentProcessed

    const { ProductId, IsActive } = sku
    const targetProductId = +((await productFile.findLine(ProductId)) ?? 0)
    const skuContext = await sourceCatalog.getSkuContext(Id, importImages)
    const { Ean, specifications, files } = skuContext

    const payload = {
      ...sku,
      ...(newId && { Id: newId }),
      ProductId: targetProductId,
      IsActive: false,
      ActivateIfPossible: IsActive,
    }

    const { Id: targetId } = await promiseWithConditionalRetry(
      () => targetCatalog.createSku(payload),
      null
    )

    if (targetId) {
      await Promise.all([
        promiseWithConditionalRetry(
          () =>
            targetCatalog.associateSkuSpecifications(targetId, specifications),
          null
        ),
        promiseWithConditionalRetry(
          () =>
            targetCatalog.createSkuEan(targetId, Ean ?? RefId).catch((e) => {
              if (e.message.includes('status code 422')) return

              throw e
            }),
          null
        ),
        promiseWithConditionalRetry(
          () => targetCatalog.createSkuFiles(targetId, files),
          null
        ),
      ])
    }

    await promiseWithConditionalRetry(
      () =>
        importEntity.save({
          executionImportId,
          name: entity,
          sourceAccount,
          sourceId: Id,
          targetId,
          payload,
          title: sku.Name,
        }),
      null
    ).catch(() => incrementVBaseEntity(context))

    skuFile.appendLine(`${Id}=>${targetId}`)
    sourceSkuProductFile.appendLine(`${Id}=>${ProductId}`)

    return targetId
  }

  const skuLineIterator = skuDetailsFile.getLineIterator()
  let index = 1
  let lastSkuId = lastId
  const taskQueue: Array<() => Promise<void>> = []

  for await (const line of skuLineIterator) {
    if (currentIndex && index < currentIndex) {
      index++
      continue
    }

    const sku = JSON.parse(line)

    if (index === 1) {
      lastSkuId = await processSku(sku)
    } else {
      const generateTask = (firstId: number, i: number) => async () => {
        await processSku({
          ...sku,
          newId: firstId ? firstId + i : undefined,
        })
      }

      if (lastSkuId) {
        taskQueue.push(generateTask(lastSkuId, index))
      }

      if (taskQueue.length === DEFAULT_CONCURRENCY) {
        await batch(taskQueue.splice(0, taskQueue.length), (t) => t())
      }
    }

    if (index % (DEFAULT_CONCURRENCY * 8) === 0 && index < sourceSkusTotal) {
      break
    }

    if (index < sourceSkusTotal) {
      index++
    }
  }

  if (taskQueue.length) {
    await batch(taskQueue, (t) => t())
  }

  if (index < sourceSkusTotal) {
    await updateCurrentImport(context, {
      entityEvent: 'sku',
      currentIndex: index + 1,
      lastId: lastSkuId,
    })
  } else {
    await updateCurrentImport(context, {
      entityEvent: 'price',
      currentIndex: null,
      lastId: null,
    })
  }

  skuLineIterator.removeAllListeners()
  skuLineIterator.close()
}

export default handleSkus
