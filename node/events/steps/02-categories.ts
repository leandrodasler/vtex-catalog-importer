import {
  getEntityBySourceId,
  incrementVBaseEntity,
  promiseWithConditionalRetry,
  sequentialBatch,
  updateCurrentImport,
} from '../../helpers'
import { FileManager } from '../../helpers/files'

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
  // const mapCategory: EntityMap = {}

  const categoryFile = new FileManager(`categories-${executionImportId}`)

  await sequentialBatch(sourceCategories, async ({ Id, ...category }) => {
    const migrated = await getEntityBySourceId(context, Id)

    if (migrated?.targetId) {
      // mapCategory[Id] = +migrated.targetId
      categoryFile.append(`${Id}=>${migrated.targetId}\n`)
    }

    // if (mapCategory[Id]) return
    if (await categoryFile.findLine(Id)) return

    const { FatherCategoryId, GlobalCategoryId = 0 } = category

    const payload = {
      ...category,
      GlobalCategoryId: GlobalCategoryId || undefined,
      FatherCategoryId: FatherCategoryId
        ? +((await categoryFile.findLine(FatherCategoryId)) ?? 0) || undefined // mapCategory[FatherCategoryId]
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

    // mapCategory[Id] = targetId
    categoryFile.append(`${Id}=>${targetId}\n`)
  })

  // context.state.mapCategory = mapCategory
}

export default handleCategories
