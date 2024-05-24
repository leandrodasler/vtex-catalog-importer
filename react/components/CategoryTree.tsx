import {
  Alert,
  Button,
  Card,
  CardActions,
  CardHeader,
  CardTitle,
  Checkbox,
  IconCaretDown,
  IconCaretRight,
  Skeleton,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  csx,
  useTabState,
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
    refetch: refetchCategories,
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

      const markSubcategories = (category: Category, checked: boolean) => {
        if (category.subCategories) {
          category.subCategories.forEach((subCategory) => {
            newState[subCategory.id] = checked
            markSubcategories(subCategory, checked)
          })
        }
      }

      const category = findCategoryById(data?.categories, categoryId)

      if (category) {
        markSubcategories(category, isChecked)
      }

      if (isChecked) {
        let parentCategory = findParentCategory(data?.categories, categoryId)

        while (parentCategory) {
          newState[parentCategory.id] = true
          parentCategory = findParentCategory(
            data?.categories,
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

  const state = useTabState()

  return (
    <Card>
      <CardHeader>
        {loadingSettings ? (
          <Skeleton style={{ width: 300, height: 24 }} />
        ) : (
          <CardTitle>
            {formatMessage(messages.categories, {
              account: settings?.appSettings?.account,
            })}
          </CardTitle>
        )}
        <CardActions>
          <Button
            variant="tertiary"
            onClick={() => refetchCategories()}
            disabled={loadingCategories}
          >
            {formatMessage(messages.categoriesRefreshLabel)}
          </Button>
        </CardActions>
      </CardHeader>
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

      <TabList state={state}>
        <Tab id="1">Passo 1</Tab>
        <Tab disabled={state.activeId === '1'} id="2">
          Passo 2
        </Tab>
      </TabList>
      <TabPanel state={state} id="1">
        Conteúdo 1
        <Button onClick={() => state.select('2')}>Próximo passo</Button>
      </TabPanel>
      <TabPanel state={state} id="2">
        Conteúdo 2
      </TabPanel>
    </Card>
  )
}

export default CategoryTree
