import React from 'react'
import { useQuery } from 'react-apollo'
import type { Category, Query } from 'ssesandbox04.catalog-importer'
import { Layout, PageBlock, PageHeader, Spinner } from 'vtex.styleguide'

import CATEGORIES_QUERY from './graphql/categories.graphql'
import { useMessages } from './messages/useMessages'

const convertCategory = (c: Category): Partial<Category> =>
  ({
    id: c.id,
    name: c.name,
    subCategories: c.subCategories?.map(convertCategory),
  } as Partial<Category>)

const CatalogImporter = () => {
  const messages = useMessages()
  const { data, loading } = useQuery<Query>(CATEGORIES_QUERY)
  const categories = data?.categories?.map(convertCategory)

  return (
    <Layout
      fullWidth
      pageHeader={
        <PageHeader
          title={messages.appTitle}
          subtitle={messages.versionLabel}
        />
      }
    >
      <PageBlock title={messages.categories}>
        <pre>{loading ? <Spinner /> : JSON.stringify(categories, null, 2)}</pre>
      </PageBlock>
    </Layout>
  )
}

export default CatalogImporter
