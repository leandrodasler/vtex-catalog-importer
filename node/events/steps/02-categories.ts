import {
  getTargetEntityByName,
  sequentialBatch,
  updateCurrentImport,
} from '../../helpers'

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
  const targetCategories = await targetCatalog.getCategoryTreeFlattened()
  const sourceCategoriesTotal = categories.length

  await updateCurrentImport(context, { sourceCategoriesTotal })
  const sourceCategories = await sourceCatalog.getCategories(categories)
  const mapCategory: EntityMap = {}
  const mapCategoryName: EntityMapName = {}

  await sequentialBatch(sourceCategories, async ({ Id, ...category }) => {
    const { FatherCategoryId, GlobalCategoryId = 0 } = category
    const existingCategory =
      mapCategoryName[category.Name] ??
      targetCategories.find(
        (c) => c.name.toLowerCase() === category.Name.toLowerCase()
      ) ??
      (await getTargetEntityByName(context, category.Name))

    const payloadNew = {
      ...category,
      GlobalCategoryId: GlobalCategoryId || undefined,
      FatherCategoryId: FatherCategoryId
        ? mapCategory[FatherCategoryId]
        : undefined,
    }

    const { Id: targetId } = existingCategory
      ? { Id: +existingCategory.id }
      : await targetCatalog.createCategory(payloadNew)

    const payload = existingCategory ? { ...existingCategory } : payloadNew

    await importEntity.save({
      executionImportId,
      name: entity,
      sourceAccount,
      sourceId: Id,
      targetId,
      payload,
      title: category.Name,
      pathParams: existingCategory ? { category: targetId } : null,
    })

    mapCategory[Id] = targetId
    mapCategoryName[category.Name] = { id: targetId }
  })

  context.state.mapCategory = mapCategory
}

export default handleCategories
