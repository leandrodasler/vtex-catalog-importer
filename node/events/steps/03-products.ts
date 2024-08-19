import { sequentialBatch, updateCurrentImport } from '../../helpers'

const handleProducts = async (context: AppEventContext) => {
  const { sourceCatalog, targetCatalog, importEntity } = context.clients
  const {
    id: executionImportId,
    settings = {},
    categoryTree,
  } = context.state.body

  const { entity, mapCategory, mapBrand } = context.state
  const { account: sourceAccount } = settings
  const { data: sourceProducts, skuIds } = await sourceCatalog.getProducts(
    categoryTree
  )

  context.state.skuIds = skuIds

  const sourceProductsTotal = sourceProducts.length
  const sourceSkusTotal = skuIds.length
  const mapProduct: EntityMap = {}

  await updateCurrentImport(context, { sourceProductsTotal, sourceSkusTotal })
  await sequentialBatch(sourceProducts, async ({ Id, ...product }) => {
    const { DepartmentId, CategoryId, BrandId, RefId, LinkId } = product
    const targetDepartmentId = mapCategory?.[DepartmentId]
    const targetCategoryId = mapCategory?.[CategoryId]
    const targetBrandId = mapBrand?.[BrandId]

    const payload = {
      ...product,
      DepartmentId: targetDepartmentId,
      CategoryId: targetCategoryId,
      BrandId: targetBrandId,
      RefId: RefId || LinkId,
    }

    const { Id: targetId } = await targetCatalog.createProduct(payload)
    const specifications = await sourceCatalog.getProductSpecifications(Id)

    await targetCatalog.associateProductSpecifications(targetId, specifications)

    await importEntity.save({
      executionImportId,
      name: entity,
      sourceAccount,
      sourceId: Id,
      targetId,
      payload,
      title: product.Name,
    })

    mapProduct[Id] = targetId
  })

  context.state.mapProduct = mapProduct
}

export default handleProducts
