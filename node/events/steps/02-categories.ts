import {
  batch,
  CATEGORY_DELAY,
  delay,
  ENTITY_CONCURRENCY,
  flatCategoryTree,
  getEntityBySourceId,
  updateCurrentImport,
} from '../../helpers'

const handleCategories = async (context: AppEventContext) => {
  const { sourceCatalog, targetCatalog, importEntity } = context.clients
  const {
    id: executionImportId,
    settings = {},
    categoryTree,
  } = context.state.body

  const { entity: name } = context.state
  const { account: sourceAccount } = settings

  if (!categoryTree) return

  const categories = flatCategoryTree(categoryTree)
  const sourceCategoriesTotal = categories.length
  const sourceCategories = await sourceCatalog.getSourceCategories(categories)

  await updateCurrentImport(context, { sourceCategoriesTotal })
  await batch(
    sourceCategories,
    async (category) => {
      const { FatherCategoryId, GlobalCategoryId = 0 } = category

      const fatherCategoryEntity = FatherCategoryId
        ? await getEntityBySourceId(context, FatherCategoryId)
        : undefined

      const payload = {
        ...category,
        GlobalCategoryId: GlobalCategoryId || undefined,
        FatherCategoryId: fatherCategoryEntity?.targetId as number | undefined,
        Id: undefined,
      }

      const { Id: sourceId } = category
      const { Id: targetId } = await targetCatalog.createCategory(payload)

      await importEntity.save({
        executionImportId,
        name,
        sourceAccount,
        sourceId,
        targetId,
        payload,
      })

      await delay(CATEGORY_DELAY)
    },
    ENTITY_CONCURRENCY
  )
}

export default handleCategories
