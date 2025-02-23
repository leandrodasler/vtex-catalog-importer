import {
  FileManager,
  getEntityBySourceId,
  incrementVBaseEntity,
  promiseWithConditionalRetry,
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
  const sourceCategoriesTotal = categories.length

  await updateCurrentImport(context, { sourceCategoriesTotal })
  const sourceCategories = await sourceCatalog.getCategories(categories)

  const categoryFile = new FileManager(`categories-${executionImportId}`)

  await sequentialBatch(sourceCategories, async ({ Id, ...category }) => {
    const migrated = await getEntityBySourceId(context, Id)

    if (migrated?.targetId) {
      categoryFile.appendLine(`${Id}=>${migrated.targetId}`)
    }

    if (await categoryFile.findLine(Id)) return

    const { FatherCategoryId, GlobalCategoryId = 0 } = category

    const payload = {
      ...category,
      GlobalCategoryId: GlobalCategoryId || undefined,
      FatherCategoryId: FatherCategoryId
        ? +((await categoryFile.findLine(FatherCategoryId)) ?? 0) || undefined
        : undefined,
    }

    const { Id: targetId } = await promiseWithConditionalRetry(
      () => targetCatalog.createCategory(payload),
      null
    )

    await promiseWithConditionalRetry(
      () =>
        importEntity.save({
          executionImportId,
          name: entity,
          sourceAccount,
          sourceId: Id,
          targetId,
          payload,
          title: category.Name,
        }),
      null
    ).catch(() => incrementVBaseEntity(context))

    categoryFile.appendLine(`${Id}=>${targetId}`)
  })

  await updateCurrentImport(context, { entityEvent: 'product' })
}

export default handleCategories
