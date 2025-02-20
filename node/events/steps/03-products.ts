import {
  batch,
  DEFAULT_CONCURRENCY,
  FileManager,
  getEntityBySourceId,
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

  if (!categoryFile.exists()) {
    await updateCurrentImport(context, {
      entityEvent: 'category',
      currentIndex: null,
    })

    return
  }

  const productDetailsFile = new FileManager(
    `productDetails-${executionImportId}`
  )

  if (!productDetailsFile.exists() && currentIndex) {
    await updateCurrentImport(context, {
      entityEvent: 'product',
      currentIndex: null,
    })

    return
  }

  const sourceProductsTotal = productDetailsFile.exists()
    ? await productDetailsFile.getTotalLines()
    : await sourceCatalog.generateProductAndSkuFiles(
        executionImportId,
        context.clients.importExecution,
        categoryTree
      )

  if (!sourceProductsTotal || !productDetailsFile.exists()) return

  const productFile = new FileManager(`products-${executionImportId}`)

  await updateCurrentImport(context, { sourceProductsTotal })

  async function processProduct(p: ProductDetails) {
    const { Id, newId, BrandId, CategoryId, DepartmentId, ...product } = p
    const migrated = await getEntityBySourceId(context, Id)

    if (migrated?.targetId) {
      productFile.appendLine(`${Id}=>${migrated.targetId}`)
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
          title: product.Name,
        })
        .catch((e) => {
          if (e.message.includes('304')) {
            return
          }

          throw e
        })
    }

    const currentProcessed = await productFile.findLine(Id)
    const payload = { ...(newId && { Id: newId }), ...product }
    const targetCategoryId = +((await categoryFile.findLine(CategoryId)) ?? 0)

    if (currentProcessed) {
      promiseWithConditionalRetry(saveEntity, {
        targetId: currentProcessed,
        payload: { ...payload, CategoryId: targetCategoryId },
      })

      return +currentProcessed
    }

    const {
      Id: targetId,
      DepartmentId: _,
      ...created
    } = await promiseWithConditionalRetry(function createProduct() {
      return targetCatalog.createProduct(payload)
    }, null)

    const specifications = await sourceCatalog.getProductSpecifications(Id)
    const updatePayload = { ...created, CategoryId: targetCategoryId }

    await Promise.all([
      promiseWithConditionalRetry(function associateProductSpecifications() {
        return targetCatalog.associateProductSpecifications(
          targetId,
          specifications
        )
      }, null),
      promiseWithConditionalRetry(function updateProduct() {
        return targetCatalog.updateProduct(targetId, updatePayload)
      }, null),
    ])

    await Promise.all([
      promiseWithConditionalRetry(saveEntity, {
        targetId,
        payload: { ...payload, ...updatePayload },
      }),
      productFile.appendLine(`${Id}=>${targetId}`),
    ])

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

      await updateCurrentImport(context, {
        currentIndex: index + 1,
        lastId: lastProductId,
      })
    } else {
      const generateTask = (firstId: number, i: number) =>
        async function taskProduct() {
          await processProduct({
            ...product,
            newId: firstId ? firstId + i : undefined,
          })
        }

      if (lastProductId) {
        taskQueue.push(generateTask(lastProductId, index))
      }

      if (taskQueue.length === DEFAULT_CONCURRENCY) {
        await batch(
          taskQueue.splice(0, taskQueue.length),
          function taskProduct(t) {
            return t()
          }
        )
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
    await batch(taskQueue, function taskProduct(t) {
      return t()
    })
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
