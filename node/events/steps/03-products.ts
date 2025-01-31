import {
  FileManager,
  getEntityBySourceId,
  incrementVBaseEntity,
  promiseWithConditionalRetry,
  updateCurrentImport,
} from '../../helpers'

const handleProducts = async (context: AppEventContext) => {
  const { sourceCatalog, targetCatalog, importEntity } = context.clients
  const {
    id: executionImportId = '',
    settings = {},
    categoryTree,
  } = context.state.body

  const { entity } = context.state
  const { account: sourceAccount } = settings

  const categoryFile = new FileManager(`categories-${executionImportId}`)

  if (!categoryFile.exists()) return

  const {
    sourceProductsTotal,
    sourceSkusTotal,
  } = await sourceCatalog.generateProductAndSkuFiles(
    executionImportId,
    categoryTree
  )

  const productDetailsFile = new FileManager(
    `productDetails-${executionImportId}`
  )

  if (!productDetailsFile.exists()) return

  const productFile = new FileManager(`products-${executionImportId}`)
  const productFileWriteStream = productFile.getWriteStream()

  await updateCurrentImport(context, { sourceProductsTotal, sourceSkusTotal })

  const processProduct = async (p: ProductDetails) => {
    const { Id, newId, BrandId, CategoryId, DepartmentId, ...product } = p
    const migrated = await getEntityBySourceId(context, Id)

    if (migrated?.targetId) {
      productFileWriteStream.write(`${Id}=>${migrated.targetId}\n`)
    }

    const currentProcessed = await productFile.findLine(Id)

    if (currentProcessed) return +currentProcessed

    const payload = { ...(newId && { Id: newId }), ...product }

    const {
      Id: targetId,
      DepartmentId: _,
      ...created
    } = await promiseWithConditionalRetry(
      () => targetCatalog.createProduct(payload),
      null
    )

    const specifications = await sourceCatalog.getProductSpecifications(Id)
    const targetCategoryId = +((await categoryFile.findLine(CategoryId)) ?? 0)
    const updatePayload = { ...created, CategoryId: targetCategoryId }

    await Promise.all([
      promiseWithConditionalRetry(
        () =>
          targetCatalog.associateProductSpecifications(
            targetId,
            specifications
          ),
        null
      ),
      promiseWithConditionalRetry(
        () => targetCatalog.updateProduct(targetId, updatePayload),
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
          payload: { ...payload, ...updatePayload },
          title: product.Name,
        }),
      null
    ).catch(() => incrementVBaseEntity(context))

    productFileWriteStream.write(`${Id}=>${targetId}\n`)

    return targetId
  }

  const productLineIterator = productDetailsFile.getLineIterator()

  let index = 1
  let lastProductId = 0
  const MAX_CONCURRENT_TASKS = 10
  const taskQueue: Array<Promise<void>> = []

  for await (const line of productLineIterator) {
    const product = JSON.parse(line)

    if (index === 1) {
      lastProductId = await processProduct(product)
      index++
    } else {
      // eslint-disable-next-line no-loop-func
      const task = (async () => {
        await processProduct({
          ...product,
          newId: lastProductId ? lastProductId + index++ : undefined,
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
  productFileWriteStream.end()
}

export default handleProducts
