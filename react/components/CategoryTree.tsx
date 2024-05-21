import { Skeleton } from '@vtex/admin-ui'
import React from 'react'
import { useQuery } from 'react-apollo'
import type { Category, Query } from 'ssesandbox04.catalog-importer'

import CATEGORIES_QUERY from '../graphql/categories.graphql'

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

  const categories = data?.categories?.map(convertCategory)

  return (
    <div>
      {error && <pre>{JSON.stringify(error, null, 2)}</pre>}
      {loading && <Skeleton style={{ height: 300 }} />}
      {!loading && <pre>{JSON.stringify(categories, null, 2)}</pre>}
    </div>
  )
}

export default CategoryTree
