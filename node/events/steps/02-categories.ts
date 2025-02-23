import { UserInputError } from '@vtex/api'

import {
  DEFAULT_CONCURRENCY,
  FileManager,
  getEntityBySourceId,
  promiseWithConditionalRetry,
  updateCurrentImport,
} from '../../helpers'

const handleCategories = async (context: AppEventContext) => {
  const {
    sourceCatalog,
    targetCatalog,
    importEntity,
    importExecution,
  } = context.clients

  const {
    id: executionImportId = '',
    settings = {},
    categoryTree,
    currentIndex,
  } = context.state.body

  const { entity = '' } = context.state
  const { account: sourceAccount } = settings

  if (!categoryTree) {
    throw new UserInputError('Source category tree is missing')
  }

  const categories = sourceCatalog.flatCategoryTree(categoryTree)
  const categoryDetailsFile = new FileManager(
    `categoryDetails-${executionImportId}`
  )

  if (!categoryDetailsFile.exists() && currentIndex) {
    await updateCurrentImport(context, {
      entityEvent: 'category',
      currentIndex: null,
    })

    return
  }

  const sourceCategoriesTotal = categoryDetailsFile.exists()
    ? await categoryDetailsFile.getTotalLines()
    : await sourceCatalog.generateCategoryDetailsFile(
        executionImportId,
        importExecution,
        categories
      )

  if (!sourceCategoriesTotal || !categoryDetailsFile.exists()) return

  const categoryFile = new FileManager(`categories-${executionImportId}`)

  await updateCurrentImport(context, { sourceCategoriesTotal })

  async function processCategory({ Id, ...category }: CategoryDetails) {
    const migrated = await getEntityBySourceId(context, Id)

    if (migrated?.targetId) {
      categoryFile.appendLine(`${Id}=>${migrated.targetId}`)
    }

    async function saveEntity({ targetId, payload }: SaveEntityArgs) {
      return importEntity
        .saveOrUpdate({
          id: `${executionImportId}-${entity}-${Id}-${targetId}`,
          executionImportId,
          name: entity,
          sourceAccount,
          sourceId: Id,
          targetId,
          payload,
          title: category.Name,
        })
        .catch((e) => {
          if (e.message.includes('304')) {
            return
          }

          throw e
        })
    }

    const currentProcessed = await categoryFile.findLine(Id)
    const { FatherCategoryId, GlobalCategoryId = 0 } = category

    const payload = {
      ...category,
      GlobalCategoryId: GlobalCategoryId || undefined,
      FatherCategoryId: FatherCategoryId
        ? +((await categoryFile.findLine(FatherCategoryId)) ?? 0) || undefined
        : undefined,
    }

    if (currentProcessed) {
      promiseWithConditionalRetry(saveEntity, {
        targetId: currentProcessed,
        payload,
      })

      return
    }

    const { Id: targetId } = await promiseWithConditionalRetry(
      function createCategory() {
        return targetCatalog.createCategory(payload)
      },
      null
    )

    await Promise.all([
      promiseWithConditionalRetry(saveEntity, { targetId, payload }),
      categoryFile.appendLine(`${Id}=>${targetId}`),
    ])
  }

  const categoryLineIterator = categoryDetailsFile.getLineIterator()
  let index = 1

  for await (const line of categoryLineIterator) {
    if (currentIndex && index < currentIndex) {
      index++
      continue
    }

    const category = JSON.parse(line)

    await processCategory(category)

    if (
      index % (DEFAULT_CONCURRENCY * 8) === 0 &&
      index < sourceCategoriesTotal
    ) {
      break
    }

    if (index < sourceCategoriesTotal) {
      index++
    }
  }

  if (index < sourceCategoriesTotal) {
    await updateCurrentImport(context, {
      entityEvent: 'category',
      currentIndex: index + 1,
    })
  } else {
    await updateCurrentImport(context, {
      entityEvent: 'product',
      currentIndex: null,
    })
  }

  categoryLineIterator.removeAllListeners()
  categoryLineIterator.close()
}

export default handleCategories
