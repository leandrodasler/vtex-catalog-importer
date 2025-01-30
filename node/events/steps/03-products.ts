/* eslint-disable no-console */
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

  const { entity /* mapCategory */ } = context.state
  const { account: sourceAccount } = settings

  // if (!mapCategory) return

  const categoryFile = new FileManager(`categories-${executionImportId}`)

  if (!categoryFile.exists()) return

  // const { products, skuIds } = await sourceCatalog.getProducts(categoryTree)
  const {
    sourceProductsTotal,
    sourceSkusTotal,
  } = await sourceCatalog.generateProductAndSkuFiles(
    executionImportId,
    categoryTree
  )

  console.log('SALVANDO OS PRODUTOS EM UM ARQUIVO')

  const productDetailsFile = new FileManager(
    `productDetails-${executionImportId}`
  )

  if (!productDetailsFile.exists()) return

  // const [firstProduct, ...sourceProducts] = products

  // context.state.skuIds = skuIds

  // const sourceProductsTotal = products.length
  // const sourceSkusTotal = skuIds.length
  // const mapProduct: EntityMap = {}

  const productFile = new FileManager(`products-${executionImportId}`)

  await updateCurrentImport(context, { sourceProductsTotal, sourceSkusTotal })

  const processProduct = async (p: ProductDetails) => {
    const { Id, newId, BrandId, CategoryId, DepartmentId, ...product } = p
    const migrated = await getEntityBySourceId(context, Id)

    if (migrated?.targetId) {
      // mapProduct[Id] = +migrated.targetId
      productFile.append(`${Id}=>${migrated.targetId}\n`)
    }

    // if (mapProduct[Id]) return mapProduct[Id]
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
    const targetCategoryId = +((await categoryFile.findLine(CategoryId)) ?? 0) // mapCategory[CategoryId]
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

    // mapProduct[Id] = targetId
    productFile.append(`${Id}=>${targetId}\n`)

    return targetId
  }

  const productLineIterator = productDetailsFile.getLineIterator()

  let index = 1
  let lastProductId = 0
  let promises: Array<Promise<number>> = []

  for await (const line of productLineIterator) {
    const product = JSON.parse(line)

    if (index === 1) {
      lastProductId = await processProduct(product)
      index++
      console.log('lastProductId', lastProductId)
    } else {
      promises.push(
        processProduct({
          ...product,
          newId: lastProductId ? lastProductId + index++ : undefined,
        })
      )

      if (promises.length === 250) {
        await Promise.all(promises)
        promises = []
      }
    }
  }

  if (promises.length) {
    await Promise.all(promises)
  }

  // context.state.mapProduct = mapProduct
  // context.state.mapCategory = undefined
}

export default handleProducts
