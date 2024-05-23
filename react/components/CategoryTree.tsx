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
  csx,
  useToast,
} from '@vtex/admin-ui'
import React, { useEffect, useState } from 'react'
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

  // TODO remove this
  useEffect(() => {
    if (!loading && settings) {
      showToast({
        message: (
          <>
            Settings: <pre>{JSON.stringify(settings, null, 2)}</pre>
          </>
        ),
      })
    }
  }, [loading, settings, showToast])

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

  const handleCategoryChange = (categoryId: string) => {
    setCheckedCategories((prevState) => ({
      ...prevState,
      [categoryId]: !prevState[categoryId],
    }))
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
            <Button
              onClick={() =>
                // TODO remove this showToast and do processing
                showToast({
                  message: (
                    <>
                      Checked categories:
                      <pre>{JSON.stringify(checkedCategories, null, 2)}</pre>
                    </>
                  ),
                  variant: 'info',
                })
              }
              className={csx({ marginTop: '$space-4' })}
            >
              {formatMessage(messages.startLabel)}
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}

export default CategoryTree
