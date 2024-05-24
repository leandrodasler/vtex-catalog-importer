import {
  Alert,
  Button,
  Card,
  CardActions,
  CardHeader,
  CardTitle,
  Center,
  Checkbox,
  Flex,
  IconArrowLeft,
  IconArrowLineDown,
  IconArrowRight,
  IconArrowsClockwise,
  IconCaretDown,
  IconCaretRight,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  csx,
  useTabState,
} from '@vtex/admin-ui'
import React, { useEffect, useState } from 'react'
import { useQuery } from 'react-apollo'
import { useIntl } from 'react-intl'
import type { Category, Query } from 'ssesandbox04.catalog-importer'

import BRANDS_QUERY from '../graphql/brands.graphql'
import CATEGORIES_QUERY from '../graphql/categories.graphql'
import messages from '../messages'

interface CheckedCategories {
  [key: string]: boolean
}

interface ExpandedCategories {
  [key: string]: boolean
}

const CategoryTree = () => {
  const { formatMessage } = useIntl()

  const {
    data,
    loading: loadingCategories,
    error: errorCategories,
    refetch: refetchCategories,
  } = useQuery<Query>(CATEGORIES_QUERY, {
    notifyOnNetworkStatusChange: true,
  })

  const { data: brands } = useQuery<Query>(BRANDS_QUERY, {
    notifyOnNetworkStatusChange: true,
  })

  // eslint-disable-next-line no-console
  console.log({ brands })

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
        parentChecked !== undefined ? parentChecked : !prevState[categoryId]

      const newState = { ...prevState, [categoryId]: isChecked }

      const markSubcategories = (category: Category, checked: boolean) => {
        if (category.subCategories) {
          category.subCategories.forEach((subCategory: Category) => {
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
        category.subCategories.map((child: Category) =>
          renderCategory(child, level + 1)
        )}
    </div>
  )

  const categories = data?.categories

  const state = useTabState()

  // eslint-disable-next-line no-console
  console.log({ checkedCategories })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{formatMessage(messages.categoriesLabel)}</CardTitle>
        <CardActions>
          <Button
            variant="tertiary"
            onClick={() => refetchCategories()}
            disabled={loadingCategories}
            icon={<IconArrowsClockwise />}
          >
            {formatMessage(messages.categoriesRefreshLabel)}
          </Button>
        </CardActions>
      </CardHeader>
      <div className={csx({ bg: '$secondary', padding: '$space-8' })}>
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
      </div>

      <TabList state={state}>
        <Tab id="1">{formatMessage(messages.settingsLabel)}</Tab>
        <Tab disabled={state.activeId === '1'} id="2">
          {formatMessage(messages.categoriesLabel)}
        </Tab>
        <Tab disabled={state.activeId === '1' || state.activeId === '2'} id="3">
          {formatMessage(messages.optionsLabel)}
        </Tab>
        <Tab
          disabled={
            state.activeId === '1' ||
            state.activeId === '2' ||
            state.activeId === '3'
          }
          id="4"
        >
          {formatMessage(messages.startLabel)}
        </Tab>
      </TabList>
      <TabPanel
        state={state}
        id="1"
        className={csx({ bg: '$secondary', paddingTop: '$space-4' })}
      >
        Conteúdo 1
        <Flex justify="end" className={csx({ marginTop: '$space-4' })}>
          <Button
            onClick={() => state.select('2')}
            icon={<IconArrowRight />}
            iconPosition="end"
          >
            {formatMessage(messages.nextLabel)}
          </Button>
        </Flex>
      </TabPanel>
      <TabPanel
        state={state}
        id="2"
        className={csx({ bg: '$secondary', paddingTop: '$space-4' })}
      >
        Conteúdo 2
        <Flex
          justify="space-between"
          className={csx({ marginTop: '$space-4' })}
        >
          <Button onClick={() => state.select('1')} icon={<IconArrowLeft />}>
            {formatMessage(messages.previousLabel)}
          </Button>
          <Button
            onClick={() => state.select('3')}
            icon={<IconArrowRight />}
            iconPosition="end"
          >
            {formatMessage(messages.nextLabel)}
          </Button>
        </Flex>
      </TabPanel>
      <TabPanel
        state={state}
        id="3"
        className={csx({ bg: '$secondary', paddingTop: '$space-4' })}
      >
        Conteúdo 3
        <Flex
          justify="space-between"
          className={csx({ marginTop: '$space-4' })}
        >
          <Button onClick={() => state.select('2')} icon={<IconArrowLeft />}>
            {formatMessage(messages.previousLabel)}
          </Button>
          <Button
            onClick={() => state.select('4')}
            icon={<IconArrowRight />}
            iconPosition="end"
          >
            {formatMessage(messages.nextLabel)}
          </Button>
        </Flex>
      </TabPanel>
      <TabPanel
        state={state}
        id="4"
        className={csx({ bg: '$secondary', paddingTop: '$space-4' })}
      >
        Conteúdo 4
        <Flex
          justify="space-between"
          className={csx({ marginTop: '$space-4' })}
        >
          <Button onClick={() => state.select('3')} icon={<IconArrowLeft />}>
            {formatMessage(messages.previousLabel)}
          </Button>
          <Button
            disabled={!Object.values(checkedCategories).some((c) => c)}
            icon={<IconArrowLineDown />}
          >
            {formatMessage(messages.startLabel)}
          </Button>
        </Flex>
      </TabPanel>
    </Card>
  )
}

export default CategoryTree
