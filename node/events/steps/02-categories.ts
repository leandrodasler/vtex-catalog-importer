import { sequentialBatch, updateCurrentImport } from '../../helpers'

const handleCategories = async (context: AppEventContext) => {
  const { sourceCatalog, targetCatalog, importEntity } = context.clients
  const {
    id: executionImportId,
    settings = {},
    categoryTree,
  } = context.state.body

  const { entity = '' } = context.state
  const { account: sourceAccount } = settings

  if (!categoryTree) return

  const categories = sourceCatalog.flatCategoryTree(categoryTree)
  const sourceCategoriesTotal = categories.length

  await updateCurrentImport(context, { sourceCategoriesTotal })
  const sourceCategories = await sourceCatalog.getCategories(categories)
  const mapCategories: EntityMap = {}

  await sequentialBatch(sourceCategories, async ({ Id, ...category }) => {
    const { FatherCategoryId, GlobalCategoryId = 0 } = category
    const payload = {
      ...category,
      GlobalCategoryId: GlobalCategoryId || undefined,
      FatherCategoryId: FatherCategoryId
        ? mapCategories[FatherCategoryId]
        : undefined,
    }

    const { Id: targetId } = await targetCatalog.createCategory(payload)

    await importEntity.save({
      executionImportId,
      name: entity,
      sourceAccount,
      sourceId: Id,
      targetId,
      payload,
    })

    mapCategories[Id] = targetId
  })

  context.state.mapCategories = mapCategories
}

export default handleCategories
