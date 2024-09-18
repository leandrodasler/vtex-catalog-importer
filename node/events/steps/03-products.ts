import {
  batch,
  getEntityBySourceId,
  incrementVBaseEntity,
  promiseWithConditionalRetry,
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

  const lastProductId = await targetCatalog.getLastProductId()
  const { data: sourceProducts, skuIds } = await sourceCatalog.getProducts(
    categoryTree,
    lastProductId
  )

  context.state.skuIds = skuIds

  const sourceProductsTotal = sourceProducts.length
  const sourceSkusTotal = skuIds.length
  const mapProduct: EntityMap = {}

  await updateCurrentImport(context, { sourceProductsTotal, sourceSkusTotal })

  await batch(sourceProducts, async (data) => {
    const { Id, newId, BrandId, CategoryId, DepartmentId, ...product } = data
    const migrated = await getEntityBySourceId(context, Id)

    if (migrated?.targetId) {
      mapProduct[Id] = +migrated.targetId
    }

    if (mapProduct[Id]) return

    const payload = { Id: newId, ...product }

    const {
      Id: targetId,
      DepartmentId: _,
      ...created
    } = await promiseWithConditionalRetry(
      () => targetCatalog.createProduct(payload),
      null
    )

    const specifications = await sourceCatalog.getProductSpecifications(Id)
    const targetCategoryId = mapCategory[CategoryId]
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

    mapProduct[Id] = targetId
  })

  context.state.mapProduct = mapProduct
  context.state.mapCategory = undefined
}

export default handleProducts
