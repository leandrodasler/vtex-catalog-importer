import {
  batch,
  DEFAULT_CONCURRENCY,
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
    currentIndex,
    lastId,
  } = context.state.body

  const { entity } = context.state
  const { account: sourceAccount } = settings

  const categoryFile = new FileManager(`categories-${executionImportId}`)

  if (!categoryFile.exists()) return

  const productDetailsFile = new FileManager(
    `productDetails-${executionImportId}`
  )

  const { sourceProductsTotal } = productDetailsFile.exists()
    ? context.state.body
    : await sourceCatalog.generateProductAndSkuFiles(
        executionImportId,
        context.clients.importExecution,
        categoryTree
      )

  if (!sourceProductsTotal || !productDetailsFile.exists()) return

  const productFile = new FileManager(`products-${executionImportId}`)

  if (!context.state.body.sourceProductsTotal) {
    await updateCurrentImport(context, { sourceProductsTotal })
  }

  const processProduct = async (p: ProductDetails) => {
    const { Id, newId, BrandId, CategoryId, DepartmentId, ...product } = p
    const migrated = await getEntityBySourceId(context, Id)

    if (migrated?.targetId) {
      productFile.appendLine(`${Id}=>${migrated.targetId}`)
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

    productFile.appendLine(`${Id}=>${targetId}`)

    return targetId
  }

  const productLineIterator = productDetailsFile.getLineIterator()
  let index = 1
  let lastProductId = lastId
  const taskQueue: Array<() => Promise<void>> = []

  for await (const line of productLineIterator) {
    if (currentIndex && index < currentIndex) {
      index++
      continue
    }

    const product = JSON.parse(line)

    if (index === 1) {
      lastProductId = await processProduct(product)
    } else {
      const generateTask = (firstId: number, i: number) => async () => {
        await processProduct({
          ...product,
          newId: firstId ? firstId + i : undefined,
        })
      }

      if (lastProductId) {
        taskQueue.push(generateTask(lastProductId, index))
      }

      if (taskQueue.length === DEFAULT_CONCURRENCY) {
        await batch(taskQueue.splice(0, taskQueue.length), (t) => t())
      }
    }

    if (
      index % (DEFAULT_CONCURRENCY * 4) === 0 &&
      index < sourceProductsTotal
    ) {
      break
    }

    if (index < sourceProductsTotal) {
      index++
    }
  }

  if (taskQueue.length) {
    await batch(taskQueue, (t) => t())
  }

  if (index < sourceProductsTotal) {
    await updateCurrentImport(context, {
      entityEvent: 'product',
      currentIndex: index + 1,
      lastId: lastProductId,
    })
  } else {
    await updateCurrentImport(context, {
      entityEvent: 'sku',
      currentIndex: null,
      lastId: null,
    })
  }

  productLineIterator.removeAllListeners()
  productLineIterator.close()
}

export default handleProducts
