import {
  delay,
  GET_DETAILS_CONCURRENCY,
  getEntityBySourceId,
  incrementVBaseEntity,
  sequentialBatch,
  STEP_DELAY,
  updateCurrentImport,
} from '../../helpers'

const handleProducts = async (context: AppEventContext) => {
  const { sourceCatalog, targetCatalog, importEntity } = context.clients
  const {
    id: executionImportId,
    settings = {},
    categoryTree,
  } = context.state.body

  const { entity, mapCategory } = context.state
  const { account: sourceAccount } = settings

  if (!mapCategory) return

  const { data: sourceProducts, skuIds } = await sourceCatalog.getProducts(
    categoryTree
  )

  context.state.skuIds = skuIds

  const sourceProductsTotal = sourceProducts.length
  const sourceSkusTotal = skuIds.length
  const mapProduct: EntityMap = {}

  await updateCurrentImport(context, { sourceProductsTotal, sourceSkusTotal })

  let count = 0

  await sequentialBatch(sourceProducts, async (data) => {
    const { Id, BrandId, CategoryId, DepartmentId, ...product } = data
    const migrated = await getEntityBySourceId(context, Id)

    if (migrated?.targetId) {
      mapProduct[Id] = +migrated.targetId
    }

    if (mapProduct[Id]) return

    const payload = { ...product }

    const {
      Id: targetId,
      DepartmentId: _,
      ...created
    } = await targetCatalog.createProduct(payload)

    const specifications = await sourceCatalog.getProductSpecifications(Id)
    const targetCategoryId = mapCategory[CategoryId]
    const updatePayload = { ...created, CategoryId: targetCategoryId }

    await Promise.all([
      targetCatalog.associateProductSpecifications(targetId, specifications),
      targetCatalog.updateProduct(targetId, updatePayload),
    ])

    await importEntity
      .save({
        executionImportId,
        name: entity,
        sourceAccount,
        sourceId: Id,
        targetId,
        payload: { ...payload, ...updatePayload },
        title: product.Name,
      })
      .catch(() => incrementVBaseEntity(context))

    mapProduct[Id] = targetId

    if (++count % GET_DETAILS_CONCURRENCY === 0) {
      await delay(STEP_DELAY)
    }
  })

  context.state.mapProduct = mapProduct
}

export default handleProducts
