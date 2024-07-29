import {
  batch,
  getEntityBySourceId,
  NO_CONCURRENCY,
  updateCurrentImport,
} from '../../helpers'

const handleProducts = async (context: AppEventContext) => {
  const { sourceCatalog, targetCatalog, importEntity } = context.clients
  const {
    id: executionImportId,
    settings = {},
    categoryTree,
  } = context.state.body

  const { entity } = context.state
  const { account: sourceAccount } = settings
  const sourceProducts = await sourceCatalog.getProducts(categoryTree)
  const sourceProductsTotal = sourceProducts.length

  await updateCurrentImport(context, { sourceProductsTotal })

  await batch(
    sourceProducts,
    async (product) => {
      const { DepartmentId, CategoryId, BrandId, RefId } = product
      const [department, category, brand, existingProduct] = await Promise.all([
        getEntityBySourceId(context, 'category', DepartmentId),
        getEntityBySourceId(context, 'category', CategoryId),
        getEntityBySourceId(context, 'brand', BrandId),
        targetCatalog.getProductByRefId(RefId),
      ])

      const payload = {
        ...product,
        DepartmentId: department?.targetId as number,
        CategoryId: category?.targetId as number,
        BrandId: brand?.targetId as number,
        Id: undefined,
      }

      const { Id: sourceId } = product
      const { Id: targetId } = existingProduct
        ? await targetCatalog.updateProduct(existingProduct.Id, payload)
        : await targetCatalog.createProduct(payload)

      await importEntity.save({
        executionImportId,
        name: entity,
        sourceAccount,
        sourceId,
        targetId,
        payload,
        ...(existingProduct && { pathParams: `${targetId}` }),
      })
    },
    NO_CONCURRENCY
  )
}

export default handleProducts
