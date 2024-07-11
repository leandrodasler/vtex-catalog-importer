import { Skeleton, Stack, Text, csx } from '@vtex/admin-ui'
import React from 'react'
import { useIntl } from 'react-intl'
import type { ImportProgress } from 'ssesandbox04.catalog-importer'

import { messages } from '../../../common'

type Props = { importProgress?: ImportProgress; loading: boolean }

const ENTITIES_DEFAULT = {
  brands: 0,
  categories: 0,
  products: 0,
  skus: 0,
  prices: 0,
  stocks: 0,
}

export const ImportEntities = ({ importProgress, loading }: Props) => {
  const { formatMessage } = useIntl()
  const importEntities = importProgress ?? ENTITIES_DEFAULT
  const { brands, categories, products, skus, prices, stocks } = importEntities
  const skeleton = <Skeleton className={csx({ height: 20 })} />

  return (
    <Stack space="$space-2" fluid>
      <Text variant="title1" tone="info">
        {formatMessage(messages.importResultsLabel)}
      </Text>
      {loading && !brands
        ? skeleton
        : !!brands && (
            <section>
              <Text variant="title1">
                {formatMessage(messages.importResultsBrandsLabel)}:{' '}
              </Text>
              {brands}
            </section>
          )}
      {loading && !categories
        ? skeleton
        : !!categories && (
            <section>
              <Text variant="title1">
                {formatMessage(messages.importResultsCategoriesLabel)}:{' '}
              </Text>
              {categories}
            </section>
          )}
      {loading && !products
        ? skeleton
        : !!products && (
            <section>
              <Text variant="title1">
                {formatMessage(messages.importResultsProductsLabel)}:{' '}
              </Text>
              {products}
            </section>
          )}
      {loading && !skus
        ? skeleton
        : !!skus && (
            <section>
              <Text variant="title1">
                {formatMessage(messages.importResultsSkusLabel)}:{' '}
              </Text>
              {skus}
            </section>
          )}
      {loading && !prices
        ? skeleton
        : !!prices && (
            <section>
              <Text variant="title1">
                {formatMessage(messages.importResultsPricesLabel)}:{' '}
              </Text>
              {prices}
            </section>
          )}
      {loading && !stocks
        ? skeleton
        : !!stocks && (
            <section>
              <Text variant="title1">
                {formatMessage(messages.importResultsStocksLabel)}:{' '}
              </Text>
              {stocks}
            </section>
          )}
    </Stack>
  )
}
