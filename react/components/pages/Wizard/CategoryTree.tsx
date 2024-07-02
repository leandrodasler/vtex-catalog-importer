import type { TabState } from '@vtex/admin-ui'
import {
  Button,
  Checkbox,
  Flex,
  IconArrowLeft,
  IconArrowRight,
  IconArrowsClockwise,
  IconCaretDown,
  IconCaretRight,
  csx,
} from '@vtex/admin-ui'
import React, { useState } from 'react'
import { useIntl } from 'react-intl'
import type {
  AppSettingsInput,
  Category,
  Query,
  QueryCategoriesArgs,
} from 'ssesandbox04.catalog-importer'

import type { CheckedCategories } from '.'
import { ErrorMessage, SuspenseFallback, messages } from '../../common'
import { CATEGORIES_QUERY, useQueryCustom } from '../../graphql'

interface CategoryTreeProps {
  state: TabState
  settings?: AppSettingsInput
  checkedTreeOptions?: CheckedCategories
  setCheckedTreeOptions: React.Dispatch<React.SetStateAction<CheckedCategories>>
}

interface ExpandedCategories {
  [key: string]: boolean
}

const CategoryTree = ({
  state,
  settings,
  checkedTreeOptions,
  setCheckedTreeOptions,
}: CategoryTreeProps) => {
  const { formatMessage } = useIntl()

  const {
    data,
    loading: loadingCategories,
    error: errorCategories,
    refetch: refetchCategories,
  } = useQueryCustom<Query, QueryCategoriesArgs>(CATEGORIES_QUERY, {
    variables: { settings },
    toastError: false,
  })

  const [
    expandedCategories,
    setExpandedCategories,
  ] = useState<ExpandedCategories>({})

  const findCategoryById = (
    categories: Category[] | null | undefined,
    categoryId: string
  ): Category | undefined => {
    if (!categories) return undefined
    for (const category of categories) {
      if (category.id === categoryId) {
        return category
      }

      if (category.children) {
        const subCategory = findCategoryById(category.children, categoryId)

        if (subCategory) {
          return subCategory
        }
      }
    }

    return undefined
  }

  const findParentCategory = (
    categories: Category[] | null | undefined,
    categoryId: string
  ): Category | undefined => {
    if (!categories) return undefined
    for (const category of categories) {
      if (category.children?.some((sub: Category) => sub.id === categoryId)) {
        return category
      }

      if (category.children) {
        const parentCategory = findParentCategory(category.children, categoryId)

        if (parentCategory) {
          return parentCategory
        }
      }
    }

    return undefined
  }

  const handleCategoryChange = (
    categoryId: string,
    parentChecked?: boolean
  ) => {
    setCheckedTreeOptions((prevState) => {
      const categories = data?.categories ?? []
      const isChecked =
        parentChecked !== undefined
          ? parentChecked
          : !prevState[categoryId]?.checked

      const category = findCategoryById(categories, categoryId)

      const newState = {
        ...prevState,
        [categoryId]: {
          ...category,
          checked: isChecked,
          parentId: findParentCategory(categories, categoryId)?.id ?? null,
        },
      }

      const markChildren = (subCategory: Category, checked: boolean) => {
        if (subCategory.children) {
          subCategory.children.forEach((childCategory: Category) => {
            newState[childCategory.id] = {
              ...childCategory,
              checked,
              parentId: subCategory.id, // Propagando parentId para os filhos
            }
            markChildren(childCategory, checked)
          })
        }
      }

      if (category) {
        markChildren(category, isChecked)
      }

      if (isChecked) {
        let parentCategory = findParentCategory(categories, categoryId)

        while (parentCategory) {
          newState[parentCategory.id] = {
            ...parentCategory,
            checked: true,
            parentId:
              findParentCategory(categories, parentCategory.id)?.id ?? null,
          }
          parentCategory = findParentCategory(categories, parentCategory.id)
        }
      }

      return newState as CheckedCategories
    })
  }

  const handleExpandChange = (categoryId: string) => {
    setExpandedCategories((prevState) => ({
      ...prevState,
      [categoryId]: !prevState[categoryId],
    }))
  }

  const renderCategory = (category: Category, level = 0) => (
    <div
      key={category.id}
      style={{ marginLeft: level ? 30 : 0, marginBottom: 10 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
        {!category.children?.length && (
          <IconCaretRight
            size="small"
            style={{ marginRight: '5px', opacity: 0 }}
          />
        )}
        {(category.children?.length ?? 0) > 0 && (
          <>
            {expandedCategories[category.id] ? (
              <IconCaretDown
                size="small"
                onClick={() => handleExpandChange(category.id)}
                cursor="pointer"
                style={{ marginRight: '5px' }}
              />
            ) : (
              <IconCaretRight
                size="small"
                onClick={() => handleExpandChange(category.id)}
                cursor="pointer"
                style={{ marginRight: '5px' }}
              />
            )}
          </>
        )}
        <Checkbox
          checked={!!checkedTreeOptions?.[category.id]?.checked}
          label={category.name}
          onChange={() => handleCategoryChange(category.id)}
        />
      </div>
      {expandedCategories[category.id] &&
        category.children &&
        category.children.map((child: Category) =>
          renderCategory(child, level + 1)
        )}
    </div>
  )

  const categories = data?.categories

  return (
    <div className={csx({ position: 'relative' })}>
      <Button
        className={csx({ position: 'absolute', top: 0, right: 0 })}
        disabled={loadingCategories}
        icon={<IconArrowsClockwise />}
        onClick={() => refetchCategories()}
        variant="tertiary"
      >
        {formatMessage(messages.categoriesRefreshLabel)}
      </Button>
      {errorCategories && (
        <ErrorMessage
          error={errorCategories}
          title={messages.categoriesSourceError}
        />
      )}
      {loadingCategories && <SuspenseFallback />}
      {!loadingCategories &&
        !errorCategories &&
        categories &&
        categories.map((category: Category) => renderCategory(category))}

      <Flex justify="space-between" className={csx({ marginTop: '$space-4' })}>
        <Button onClick={() => state.select('1')} icon={<IconArrowLeft />}>
          {formatMessage(messages.previousLabel)}
        </Button>
        <Button
          onClick={() => state.select('3')}
          icon={<IconArrowRight />}
          iconPosition="end"
          disabled={
            !checkedTreeOptions ||
            !Object.values(checkedTreeOptions).some((entry) => entry.checked)
          }
        >
          {formatMessage(messages.nextLabel)}
        </Button>
      </Flex>
    </div>
  )
}

export default CategoryTree
