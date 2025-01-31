import {
  FileManager,
  getEntityBySourceId,
  incrementVBaseEntity,
  promiseWithConditionalRetry,
} from '../../helpers'

const handleSkus = async (context: AppEventContext) => {
  const { entity } = context.state
  const { sourceCatalog, targetCatalog, importEntity } = context.clients
  const {
    id: executionImportId = '',
    settings = {},
    importImages = true,
  } = context.state.body

  const productFile = new FileManager(`products-${executionImportId}`)
  const skuIdsFile = new FileManager(`skuIds-${executionImportId}`)

  if (!productFile.exists() || !skuIdsFile.exists()) return

  const { account: sourceAccount } = settings

  await sourceCatalog.generateSkuDetailsFiles(executionImportId)

  const skuDetailsFile = new FileManager(`skuDetails-${executionImportId}`)

  if (!skuDetailsFile.exists()) return

  const skuFile = new FileManager(`skus-${executionImportId}`)
  const skuFileWriteStream = skuFile.getWriteStream()

  const sourceSkuProductFile = new FileManager(
    `sourceSkuProduct-${executionImportId}`
  )

  const sourceSkuProductFileWriteStream = sourceSkuProductFile.getWriteStream()

  const processSku = async ({ Id, newId, RefId, ...sku }: SkuDetails) => {
    const migrated = await getEntityBySourceId(context, Id)

    if (migrated?.targetId) {
      skuFileWriteStream.write(`${Id}=>${migrated.targetId}\n`)
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

    await Promise.all([
      promiseWithConditionalRetry(
        () =>
          targetCatalog.associateSkuSpecifications(targetId, specifications),
        null
      ),
      promiseWithConditionalRetry(
        () => targetCatalog.createSkuEan(targetId, Ean ?? RefId),
        null
      ),
      promiseWithConditionalRetry(
        () => targetCatalog.createSkuFiles(targetId, files),
        null
      ),
    ])

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

    skuFileWriteStream.write(`${Id}=>${targetId}\n`)
    sourceSkuProductFileWriteStream.write(`${Id}=>${ProductId}\n`)

    return targetId
  }

  const skuLineIterator = skuDetailsFile.getLineIterator()

  let index = 1
  let lastSkuId = 0
  const MAX_CONCURRENT_TASKS = 10
  const taskQueue: Array<Promise<void>> = []

  for await (const line of skuLineIterator) {
    const sku = JSON.parse(line)

    if (index === 1) {
      lastSkuId = await processSku(sku)
      index++
    } else {
      // eslint-disable-next-line no-loop-func
      const task = (async () => {
        await processSku({
          ...sku,
          newId: lastSkuId ? lastSkuId + index++ : undefined,
        })
      })()

      taskQueue.push(task)

      if (taskQueue.length >= MAX_CONCURRENT_TASKS) {
        await Promise.race(taskQueue)
        taskQueue.splice(0, taskQueue.findIndex((t) => t === task) + 1)
      }
    }
  }

  await Promise.all(taskQueue)

  skuFileWriteStream.end()
  sourceSkuProductFileWriteStream.end()
}

export default handleSkus
