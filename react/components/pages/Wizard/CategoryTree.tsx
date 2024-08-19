import type { TabState } from '@vtex/admin-ui'
import {
  Button,
  Center,
  Checkbox,
  Flex,
  IconArrowLeft,
  IconArrowRight,
  IconArrowsClockwise,
  IconCaretDown,
  IconCaretRight,
  IconCheck,
  IconX,
  Stack,
  csx,
} from '@vtex/admin-ui'
import React, { useCallback, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'
import type {
  AppSettingsInput,
  Category,
  Query,
  QueryCategoriesArgs,
} from 'ssesandbox04.catalog-importer'

import type { CheckedCategories } from '.'
import {
  ErrorMessage,
  InputInlineWrapper,
  SuspenseFallback,
  categoryTreeMapper,
  messages,
  treeSorter,
} from '../../common'
import { CATEGORIES_QUERY, useQueryCustom } from '../../graphql'
import { findCategoryById, findParentCategory } from './common'

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

  const { data, loading, error, refetch } = useQueryCustom<
    Query,
    QueryCategoriesArgs
  >(CATEGORIES_QUERY, { variables: { settings }, toastError: false })

  const [
    expandedCategories,
    setExpandedCategories,
  ] = useState<ExpandedCategories>({})

  const categories = data?.categories?.sort(treeSorter).map(categoryTreeMapper)

  const handleCategoryChange = (categoryId: string) => {
    setCheckedTreeOptions((prevState) => {
      const isChecked = !prevState[categoryId]?.checked
      const category = findCategoryById(categories, categoryId)
      const newState = {
        ...prevState,
        [categoryId]: {
          ...category,
          checked: isChecked,
          parentId: findParentCategory(categories, categoryId)?.id,
        },
      }

      const markChildren = (subCategory: Category, checked: boolean) => {
        subCategory.children?.forEach((childCategory: Category) => {
          newState[childCategory.id] = {
            ...childCategory,
            checked,
            parentId: subCategory.id,
          }
          markChildren(childCategory, checked)
        })
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
            parentId: findParentCategory(categories, parentCategory.id)?.id,
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
        {!!category.children?.length && (
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
        <InputInlineWrapper>
          <Checkbox
            checked={!!checkedTreeOptions?.[category.id]?.checked}
            label={category.name}
            onChange={() => handleCategoryChange(category.id)}
          />
        </InputInlineWrapper>
      </div>
      {expandedCategories[category.id] &&
        category.children?.map((child: Category) =>
          renderCategory(child, level + 1)
        )}
    </div>
  )

  const anyChecked = useMemo(
    () =>
      checkedTreeOptions &&
      Object.values(checkedTreeOptions).some((entry) => entry.checked),
    [checkedTreeOptions]
  )

  const toggleSelectAll = useCallback(() => {
    const newState: CheckedCategories = {}
    const toggle = ({ id, name, children }: Category) => {
      newState[id] = {
        checked: !anyChecked,
        id,
        name,
        parentId: findParentCategory(categories, id)?.id,
      }

      children?.forEach((child: Category) => toggle(child))
    }

    categories?.forEach(toggle)
    setCheckedTreeOptions(newState)
  }, [anyChecked, categories, setCheckedTreeOptions])

  return (
    <Stack space="$space-4" fluid>
      <Flex justify="space-between">
        <Button
          disabled={loading || error || !categories?.length}
          icon={anyChecked ? <IconX /> : <IconCheck />}
          onClick={() => toggleSelectAll()}
          variant="tertiary"
        >
          {formatMessage(
            anyChecked ? messages.unselectAllLabel : messages.selectAllLabel
          )}
        </Button>
        <Button
          disabled={loading}
          icon={<IconArrowsClockwise />}
          onClick={() => refetch()}
          variant="tertiary"
        >
          {formatMessage(messages.reloadLabel)}
        </Button>
      </Flex>
      {error && (
        <Center>
          <ErrorMessage error={error} title={messages.categoriesSourceError} />
        </Center>
      )}
      {loading && <SuspenseFallback />}
      {!error && !loading && categories?.length && (
        <section>
          {categories.map((category: Category) => renderCategory(category))}
        </section>
      )}
      <Flex justify="space-between" className={csx({ marginTop: '$space-4' })}>
        <Button
          variant="secondary"
          onClick={() => state.select('1')}
          icon={<IconArrowLeft />}
        >
          {formatMessage(messages.previousLabel)}
        </Button>
        <Button
          onClick={() => state.select('3')}
          icon={<IconArrowRight />}
          iconPosition="end"
          disabled={!anyChecked}
        >
          {formatMessage(messages.nextLabel)}
        </Button>
      </Flex>
    </Stack>
  )
}

export default CategoryTree
