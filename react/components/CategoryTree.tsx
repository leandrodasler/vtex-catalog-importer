import {
  Alert,
  Button,
  Card,
  CardHeader,
  CardTitle,
  Checkbox,
  IconCaretDown,
  IconCaretRight,
  Spinner,
  Stack,
  csx,
  useToast,
} from '@vtex/admin-ui'
import React, { useState } from 'react'
import { useQuery } from 'react-apollo'
import { useIntl } from 'react-intl'
import type { Category, Query } from 'ssesandbox04.catalog-importer'

import APP_SETTINGS_QUERY from '../graphql/appSettings.graphql'
import CATEGORIES_QUERY from '../graphql/categories.graphql'
import { goToSettings } from '../helpers'
import messages from '../messages'

interface CheckedCategories {
  [key: string]: boolean
}

interface ExpandedCategories {
  [key: string]: boolean
}

const CategoryTree = () => {
  const showToast = useToast()
  const { formatMessage } = useIntl()

  const {
    data: settings,
    loading: loadingSettings,
    error: errorSettings,
  } = useQuery<Query>(APP_SETTINGS_QUERY, {
    notifyOnNetworkStatusChange: true,
  })

  const {
    data,
    loading: loadingCategories,
    error: errorCategories,
  } = useQuery<Query>(CATEGORIES_QUERY, {
    notifyOnNetworkStatusChange: true,
  })

  const loading = loadingSettings || loadingCategories

  if (errorSettings) {
    showToast({
      message: formatMessage({
        id: errorSettings.graphQLErrors?.[0].message,
        defaultMessage: errorSettings.message,
      }),
      variant: 'critical',
    })
  }

  if (errorCategories) {
    showToast({
      message: formatMessage({
        id: errorCategories.graphQLErrors?.[0].message,
        defaultMessage: errorCategories.message,
      }),
      variant: 'critical',
      action: {
        label: formatMessage(messages.settingsLinkLabel),
        onClick: goToSettings,
      },
    })
  }

  const [checkedCategories, setCheckedCategories] = useState<CheckedCategories>(
    {}
  )

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
      if (category.subCategories?.some((sub) => sub.id === categoryId)) {
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
        parentChecked !== undefined ? parentChecked : !prevState[categoryId]

      const newState = { ...prevState, [categoryId]: isChecked }

      const category = findCategoryById(
        data?.categories ?? undefined,
        categoryId
      )

      if (category?.subCategories) {
        category.subCategories.forEach((subCategory) => {
          newState[subCategory.id] = isChecked
          if (subCategory.subCategories) {
            handleCategoryChange(subCategory.id, isChecked)
          }
        })
      }

      if (isChecked) {
        let parentCategory = findParentCategory(
          data?.categories ?? undefined,
          categoryId
        )

        while (parentCategory) {
          newState[parentCategory.id] = true
          parentCategory = findParentCategory(
            data?.categories ?? undefined,
            parentCategory.id
          )
        }
      }

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
      style={{ marginLeft: level * 20, marginBottom: '10px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {category.subCategories && category.subCategories.length > 0 && (
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
          checked={!!checkedCategories[category.id]}
          label={category.name}
          onChange={() => handleCategoryChange(category.id)}
        />
      </div>
      {expandedCategories[category.id] &&
        category.subCategories &&
        category.subCategories.map((child) => renderCategory(child, level + 1))}
    </div>
  )

  const categories = data?.categories

  return (
    <Card>
      {!loading && categories && (
        <CardHeader>
          <CardTitle>
            {formatMessage(messages.categories, {
              account: settings?.appSettings?.account,
            })}
          </CardTitle>
        </CardHeader>
      )}
      <div className={csx({ bg: '$secondary', padding: '$space-8' })}>
        {errorCategories && (
          <Stack>
            <Alert variant="critical">
              {formatMessage(messages.categoriesSourceError)}
            </Alert>
          </Stack>
        )}
        {loading && <Spinner />}
        {!loading && categories && (
          <>
            {categories.map((category) => renderCategory(category))}
            <Button className={csx({ marginTop: '$space-4' })}>
              {formatMessage(messages.startLabel)}
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}

export default CategoryTree
