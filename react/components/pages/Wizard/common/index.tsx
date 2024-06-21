import { Stack } from '@vtex/admin-ui'
import React from 'react'
import type { CategoryInput } from 'ssesandbox04.catalog-importer'

import type { CheckedCategories, CheckedCategory } from '..'
import { Checked, Unchecked } from '../../../common'

type ImportOptionProps = { label: string; condition: boolean }

export const ImportOption = ({ label, condition }: ImportOptionProps) => (
  <Stack direction="row" space="$space-1">
    <span>{label}</span>
    {condition ? <Checked /> : <Unchecked />}
  </Stack>
)

export const buildTree = (categories: CheckedCategories) => {
  const tree: {
    [key: string]: CheckedCategory & { children: CheckedCategory[] }
  } = {}

  Object.values(categories)
    .filter((category) => category.checked)
    .forEach((category) => {
      tree[category.id] = { ...category, children: [] }
    })

  Object.values(tree)
    .filter((category) => category.checked)
    .forEach((category) => {
      if (category.parentId && tree[category.parentId]) {
        tree[category.parentId].children.push(category)
      }
    })

  return Object.values(tree).filter((category) => !category.parentId)
}

type CategoryTreeViewProps = { categories: CheckedCategory[] }

export const CategoryTreeView = ({ categories }: CategoryTreeViewProps) => {
  return (
    <ul>
      {categories.map((category) => (
        <li key={category.id} style={{ marginLeft: 20 }}>
          {category.name}
          {category.children && category.children.length > 0 && (
            <CategoryTreeView categories={category.children} />
          )}
        </li>
      ))}
    </ul>
  )
}

export const mapToCategoryInput: (
  categories?: CheckedCategory[]
) => CategoryInput[] = (categories) => {
  return categories?.map((category) => ({
    ...category,
    checked: undefined,
    parentId: undefined,
    isRoot: undefined,
    children: mapToCategoryInput(category.children),
  })) as CategoryInput[]
}
