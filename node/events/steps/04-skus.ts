import {
  batch,
  DEFAULT_CONCURRENCY,
  FileManager,
  getEntityBySourceId,
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

  if (!productFile.exists()) {
    await updateCurrentImport(context, {
      entityEvent: 'product',
      currentIndex: null,
    })

    return
  }

  const { account: sourceAccount } = settings

  const skuDetailsFile = new FileManager(`skuDetails-${executionImportId}`)

  if (!skuDetailsFile.exists() && currentIndex) {
    await updateCurrentImport(context, {
      entityEvent: 'sku',
      currentIndex: null,
    })

    return
  }

  const sourceSkusTotal = skuDetailsFile.exists()
    ? await skuDetailsFile.getTotalLines()
    : await sourceCatalog.generateSkuDetailsFiles(
        executionImportId,
        importExecution
      )

  if (!sourceSkusTotal || !skuDetailsFile.exists()) return

  const skuFile = new FileManager(`skus-${executionImportId}`)
  const sourceSkuProductFile = new FileManager(
    `sourceSkuProduct-${executionImportId}`
  )

  await updateCurrentImport(context, { sourceSkusTotal })

  async function processSku({ Id, newId, RefId, ...sku }: SkuDetails) {
    const migrated = await getEntityBySourceId(context, Id)

    if (migrated?.targetId) {
      skuFile.appendLine(`${Id}=>${migrated.targetId}`)
    }

    async function saveEntity({ targetId, payload }: SaveEntityArgs) {
      return importEntity
        .saveOrUpdate({
          id: `${executionImportId}-${entity}-${Id}-${targetId}`,
          executionImportId,
          name: entity,
          sourceAccount,
          sourceId: Id,
          targetId,
          payload,
          title: sku.Name,
        })
        .catch((e) => {
          if (e.message.includes('304')) {
            return
          }

          throw e
        })
    }

    const currentProcessed = await skuFile.findLine(Id)
    const { ProductId, IsActive } = sku
    const targetProductId = +((await productFile.findLine(ProductId)) ?? 0)
    const payload = {
      ...sku,
      ...(newId && { Id: newId }),
      ProductId: targetProductId,
      IsActive: false,
      ActivateIfPossible: IsActive,
    }

    if (currentProcessed) {
      promiseWithConditionalRetry(saveEntity, {
        targetId: currentProcessed,
        payload,
      })

      return +currentProcessed
    }

    const skuContext = await sourceCatalog.getSkuContext(Id, importImages)
    const { Ean, specifications, files } = skuContext
    const { Id: targetId } = await promiseWithConditionalRetry(
      function createSku() {
        return targetCatalog.createSku(payload)
      },
      null
    )

    if (targetId) {
      await Promise.all([
        promiseWithConditionalRetry(function associateSkuSpecifications() {
          return targetCatalog.associateSkuSpecifications(
            targetId,
            specifications
          )
        }, null),
        promiseWithConditionalRetry(function createSkuEan() {
          return targetCatalog
            .createSkuEan(targetId, Ean ?? RefId)
            .catch((e) => {
              if (e.message.includes('status code 422')) return

              throw e
            })
        }, null),
        promiseWithConditionalRetry(function createSkuFiles() {
          return targetCatalog.createSkuFiles(targetId, files)
        }, null),
      ])
    }

    await Promise.all([
      promiseWithConditionalRetry(saveEntity, {
        targetId,
        payload,
      }),
      skuFile.appendLine(`${Id}=>${targetId}`),
      sourceSkuProductFile.appendLine(`${Id}=>${ProductId}`),
    ])

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

      await updateCurrentImport(context, {
        currentIndex: index + 1,
        lastId: lastSkuId,
      })
    } else {
      const generateTask = (firstId: number, i: number) =>
        async function taskSku() {
          await processSku({
            ...sku,
            newId: firstId ? firstId + i : undefined,
          })
        }

      if (lastSkuId) {
        taskQueue.push(generateTask(lastSkuId, index))
      }

      if (taskQueue.length === DEFAULT_CONCURRENCY) {
        await batch(taskQueue.splice(0, taskQueue.length), function taskSku(t) {
          return t()
        })
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
    await batch(taskQueue, function taskSku(t) {
      return t()
    })
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
