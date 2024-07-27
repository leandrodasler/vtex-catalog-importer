import {
  batch,
  CATEGORY_DELAY,
  delay,
  flatCategoryTree,
  getEntityBySourceId,
  NO_CONCURRENCY,
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

  const categories = flatCategoryTree(categoryTree)
  const sourceCategoriesTotal = categories.length
  const sourceCategories = await sourceCatalog.getCategories(categories)

  await updateCurrentImport(context, { sourceCategoriesTotal })
  await batch(
    sourceCategories,
    async (category) => {
      const { FatherCategoryId, GlobalCategoryId = 0 } = category

      const fatherCategory = FatherCategoryId
        ? await getEntityBySourceId(context, entity, FatherCategoryId)
        : undefined

      const payload = {
        ...category,
        GlobalCategoryId: GlobalCategoryId || undefined,
        FatherCategoryId: fatherCategory?.targetId as number | undefined,
        Id: undefined,
      }

      const { Id: sourceId } = category
      const { Id: targetId } = await targetCatalog.createCategory(payload)

      await importEntity.save({
        executionImportId,
        name: entity,
        sourceAccount,
        sourceId,
        targetId,
        payload,
      })

      await delay(CATEGORY_DELAY)
    },
    NO_CONCURRENCY
  )
}

export default handleCategories
