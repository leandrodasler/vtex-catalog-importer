import {
  Button,
  Checkbox,
  IconArrowDown,
  IconArrowRight,
  Skeleton,
} from '@vtex/admin-ui'
import React, { useState } from 'react'
import { useQuery } from 'react-apollo'
import type { Category, Query } from 'ssesandbox04.catalog-importer'

import CATEGORIES_QUERY from '../graphql/categories.graphql'

interface CheckedCategories {
  [key: string]: boolean
}

interface ExpandedCategories {
  [key: string]: boolean
}

const convertCategory = (c: Category): Partial<Category> =>
  ({
    id: c.id,
    name: c.name,
    subCategories: c.subCategories?.map(convertCategory),
  } as Partial<Category>)

const CategoryTree = () => {
  const { data, loading, error } = useQuery<Query>(CATEGORIES_QUERY, {
    notifyOnNetworkStatusChange: true,
  })

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

  const renderCategory = (category: Partial<Category>, level = 0) => (
    <div
      key={category.id}
      style={{ marginLeft: level * 20, marginBottom: '10px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {category.subCategories && category.subCategories.length > 0 && (
          <Button
            onClick={() => handleExpandChange(category.id!)}
            style={{ cursor: 'pointer', marginRight: '5px' }}
            size="normal"
            variant="neutralTertiary"
          >
            {expandedCategories[category.id!] ? (
              <IconArrowDown />
            ) : (
              <IconArrowRight />
            )}
          </Button>
        )}
        <Checkbox
          checked={!!checkedCategories[category.id!]}
          label={category.name}
          onChange={() => handleCategoryChange(category.id!)}
        />
      </div>
      {expandedCategories[category.id!] &&
        category.subCategories &&
        category.subCategories.map((child: any) =>
          renderCategory(child, level + 1)
        )}
    </div>
  )

  const categories = data?.categories?.map(convertCategory)

  return (
    <div className="bg-muted-5 pa8">
      {error && <pre>{JSON.stringify(error, null, 2)}</pre>}
      {loading && <Skeleton style={{ height: 300 }} />}
      {!loading &&
        categories &&
        categories.map((category: any) => renderCategory(category))}
      <div style={{ marginTop: '10px' }}>
        <Button
          // eslint-disable-next-line no-console
          onClick={() => console.log(checkedCategories)}
          style={{ marginTop: '10px' }}
        >
          Iniciar processamento
        </Button>
      </div>
    </div>
  )
}

export default CategoryTree
