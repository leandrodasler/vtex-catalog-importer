import type { Category } from 'ssesandbox04.catalog-importer'

import { delay, updateCurrentImport } from '../../helpers'

const matrixCategories = (
  categoryTree: Category[],
  level = 0,
  result: Category[][] = []
) => {
  if (!result[level]) {
    result[level] = []
  }

  categoryTree.forEach((category) => {
    result[level].push(category)
    if (category.children && category.children.length > 0) {
      matrixCategories(category.children, level + 1, result)
    }
  })

  return result
}

const handleCategories = async (context: AppEventContext) => {
  // TODO: process categories import
  const { importEntity } = context.clients
  const { id, settings = {}, categoryTree } = context.state.body
  const { entity } = context.state
  const { account: sourceAccount } = settings

  if (!categoryTree) return

  const categoriesFlat = matrixCategories(categoryTree).flat()
  const sourceCategoriesTotal = categoriesFlat.length

  await updateCurrentImport(context, { sourceCategoriesTotal })

  for (let i = 1; i <= sourceCategoriesTotal; i++) {
    // eslint-disable-next-line no-await-in-loop
    await delay(1000)

    // eslint-disable-next-line no-await-in-loop
    await importEntity.save({
      executionImportId: id,
      name: entity,
      sourceAccount,
      sourceId: i,
      payload: { name: `${context.state.entity} ${i}` },
    })
  }
}

export default handleCategories
