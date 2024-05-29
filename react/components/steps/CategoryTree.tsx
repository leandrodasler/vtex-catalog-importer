import type { TabState } from '@vtex/admin-ui'
import {
  Alert,
  Button,
  Center,
  Checkbox,
  Flex,
  IconArrowLeft,
  IconArrowRight,
  IconArrowsClockwise,
  IconCaretDown,
  IconCaretRight,
  Spinner,
  Stack,
  csx,
} from '@vtex/admin-ui'
import React, { useEffect, useState } from 'react'
import { useQuery } from 'react-apollo'
import { useIntl } from 'react-intl'
import type {
  AppSettingsInput,
  Category,
  Query,
  QueryCategoriesArgs,
} from 'ssesandbox04.catalog-importer'

import BRANDS_QUERY from '../../graphql/brands.graphql'
import CATEGORIES_QUERY from '../../graphql/categories.graphql'
import messages from '../../messages'

interface CategoryTreeProps {
  state: TabState
  settings?: AppSettingsInput
  setCheckedTreeOptions: (checkedOptions: CheckedCategories) => void
}

interface CheckedCategories {
  [key: string]: { checked: boolean; name: string }
}

interface ExpandedCategories {
  [key: string]: boolean
}

const CategoryTree = ({
  state,
  settings,
  setCheckedTreeOptions,
}: CategoryTreeProps) => {
  const { formatMessage } = useIntl()

  const {
    data,
    loading: loadingCategories,
    error: errorCategories,
    refetch: refetchCategories,
  } = useQuery<Query, QueryCategoriesArgs>(CATEGORIES_QUERY, {
    notifyOnNetworkStatusChange: true,
    variables: { settings },
  })

  const { data: brands } = useQuery<Query>(BRANDS_QUERY, {
    notifyOnNetworkStatusChange: true,
  })

  const [checkedCategories, setCheckedCategories] = useState<CheckedCategories>(
    {}
  )

  const [
    expandedCategories,
    setExpandedCategories,
  ] = useState<ExpandedCategories>({})

  useEffect(() => {
    if (loadingCategories) {
      setCheckedCategories({})
      setExpandedCategories({})
    }
  }, [loadingCategories])

  const findCategoryById = (
    categories: Category[] | null | undefined,
    categoryId: string
  ): Category | undefined => {
    if (!categories) return undefined
    for (const category of categories) {
      if (category.id === categoryId) {
        return category
      }

      if (category.subCategories) {
        const subCategory = findCategoryById(category.subCategories, categoryId)

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
      if (
        category.subCategories?.some((sub: Category) => sub.id === categoryId)
      ) {
        return category
      }

      if (category.subCategories) {
        const parentCategory = findParentCategory(
          category.subCategories,
          categoryId
        )

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
    setCheckedCategories((prevState) => {
      const isChecked =
        parentChecked !== undefined
          ? parentChecked
          : !prevState[categoryId]?.checked

      const category = findCategoryById(data?.categories, categoryId)

      const newState = {
        ...prevState,
        [categoryId]: { checked: isChecked, name: category?.name ?? '' },
      }

      const markSubcategories = (subCategory: Category, checked: boolean) => {
        if (subCategory.subCategories) {
          subCategory.subCategories.forEach((childCategory: Category) => {
            newState[childCategory.id] = { checked, name: childCategory.name }
            markSubcategories(childCategory, checked)
          })
        }
      }

      if (category) {
        markSubcategories(category, isChecked)
      }

      if (isChecked) {
        let parentCategory = findParentCategory(data?.categories, categoryId)

        while (parentCategory) {
          newState[parentCategory.id] = {
            checked: true,
            name: parentCategory.name,
          }
          parentCategory = findParentCategory(
            data?.categories,
            parentCategory.id
          )
        }
      }

      setCheckedTreeOptions(newState)

      return newState
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
        {!category.subCategories?.length && (
          <IconCaretRight
            size="small"
            style={{ marginRight: '5px', opacity: 0 }}
          />
        )}
        {(category.subCategories?.length ?? 0) > 0 && (
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
          checked={!!checkedCategories[category.id]?.checked}
          label={category.name}
          onChange={() => handleCategoryChange(category.id)}
        />
      </div>
      {expandedCategories[category.id] &&
        category.subCategories &&
        category.subCategories.map((child: Category) =>
          renderCategory(child, level + 1)
        )}
    </div>
  )

  const categories = data?.categories

  // eslint-disable-next-line no-console
  console.log('checkedCategories:', checkedCategories)
  // eslint-disable-next-line no-console
  console.log('brands:', brands?.brands)

  return (
    <div className={csx({ position: 'relative' })}>
      <Button
        className={csx({ position: 'absolute', top: 0, right: 0 })}
        disabled={loadingCategories}
        icon={<IconArrowsClockwise />}
        onClick={() => refetchCategories({ variables: { settings } })}
        variant="tertiary"
      >
        {formatMessage(messages.categoriesRefreshLabel)}
      </Button>
      {errorCategories && (
        <Center>
          <Alert variant="critical">
            <Stack space="$space-4">
              <span>{formatMessage(messages.categoriesSourceError)}</span>
              <span>
                {formatMessage({
                  id:
                    errorCategories.graphQLErrors?.[0]?.message ||
                    errorCategories.message,
                })}
              </span>
            </Stack>
          </Alert>
        </Center>
      )}
      {loadingCategories && (
        <Center>
          <Spinner />
        </Center>
      )}
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
            !Object.values(checkedCategories).some((entry) => entry.checked)
          }
        >
          {formatMessage(messages.nextLabel)}
        </Button>
      </Flex>
    </div>
  )
}

export default CategoryTree
