import { batch, getEntityBySourceId, updateCurrentImport } from '../../helpers'

const handleProducts = async (context: AppEventContext) => {
  const { sourceCatalog, targetCatalog, importEntity } = context.clients
  const {
    id: executionImportId,
    settings = {},
    categoryTree,
  } = context.state.body

  const { entity } = context.state
  const { account: sourceAccount } = settings

  if (!categoryTree) return
  const { productIds, skuIds } = await sourceCatalog.getProductAndSkuIds(
    categoryTree
  )

  context.state.skuIds = skuIds
  const { length: sourceProductsTotal } = productIds
  const { length: sourceSkusTotal } = skuIds

  await updateCurrentImport(context, { sourceProductsTotal, sourceSkusTotal })
  const sourceProducts = await sourceCatalog.getProducts(productIds)

  await batch(sourceProducts, async (product) => {
    const { DepartmentId, CategoryId, BrandId } = product
    const [department, category, brand] = await Promise.all([
      getEntityBySourceId(context, 'category', DepartmentId),
      getEntityBySourceId(context, 'category', CategoryId),
      getEntityBySourceId(context, 'brand', BrandId),
    ])

    const payload = {
      ...product,
      DepartmentId: department?.targetId as number,
      CategoryId: category?.targetId as number,
      BrandId: brand?.targetId as number,
      Id: undefined,
    }

    const { Id: sourceId } = product
    const { Id: targetId } = await targetCatalog.createProduct(payload)

    await importEntity.save({
      executionImportId,
      name: entity,
      sourceAccount,
      sourceId,
      targetId,
      payload,
    })
  })
}

export default handleProducts
