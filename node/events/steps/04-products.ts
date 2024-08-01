import { sequentialBatch, updateCurrentImport } from '../../helpers'

const handleProducts = async (context: AppEventContext) => {
  const { sourceCatalog, targetCatalog, importEntity } = context.clients
  const {
    id: executionImportId,
    settings = {},
    categoryTree,
  } = context.state.body

  const { entity, mapCategories, mapBrands } = context.state
  const { account: sourceAccount } = settings
  const { data: sourceProducts, skuIds } = await sourceCatalog.getProducts(
    categoryTree
  )

  context.state.skuIds = skuIds

  const sourceProductsTotal = sourceProducts.length
  const sourceSkusTotal = skuIds.length
  const mapProducts: EntityMap = {}

  await updateCurrentImport(context, { sourceProductsTotal, sourceSkusTotal })
  await sequentialBatch(sourceProducts, async ({ Id, ...product }) => {
    const { DepartmentId, CategoryId, BrandId, RefId, LinkId } = product
    const targetDepartmentId = mapCategories?.[DepartmentId]
    const targetCategoryId = mapCategories?.[CategoryId]
    const targetBrandId = mapBrands?.[BrandId]
    const existing = await targetCatalog.getProductByRefId(RefId || LinkId)
    const payload = {
      ...product,
      DepartmentId: targetDepartmentId,
      CategoryId: targetCategoryId,
      BrandId: targetBrandId,
      RefId: RefId || LinkId,
    }

    const { Id: targetId } = existing
      ? await targetCatalog.updateProduct(existing.Id, payload)
      : await targetCatalog.createProduct(payload)

    await importEntity.save({
      executionImportId,
      name: entity,
      sourceAccount,
      sourceId: Id,
      targetId,
      payload,
      ...(existing && { pathParams: `${targetId}` }),
    })

    mapProducts[Id] = targetId
  })

  context.state.mapProducts = mapProducts
}

export default handleProducts
