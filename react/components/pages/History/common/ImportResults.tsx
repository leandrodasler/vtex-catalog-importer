import { Stack, Text } from '@vtex/admin-ui'
import React from 'react'
import { useIntl } from 'react-intl'
import type { ImportProgress } from 'ssesandbox04.catalog-importer'

import { EntitySkeleton } from '.'
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

export const ImportResults = ({ importProgress, loading }: Props) => {
  const { formatMessage } = useIntl()
  const importEntities = importProgress ?? ENTITIES_DEFAULT
  const { brands, categories, products, skus, prices, stocks } = importEntities

  return (
    <Stack space="$space-2" fluid>
      <Text variant="title1" tone="info">
        {formatMessage(messages.importResultsLabel)}
      </Text>
      {importProgress?.currentImport.error && (
        <section>
          <Text tone="critical">{importProgress?.currentImport.error}</Text>
        </section>
      )}
      {loading && !brands ? (
        <EntitySkeleton />
      ) : (
        !!brands && (
          <section>
            <Text variant="title1">
              {formatMessage(messages.importResultsBrandsLabel)}:{' '}
            </Text>
            {brands}
          </section>
        )
      )}
      {loading && !categories ? (
        <EntitySkeleton />
      ) : (
        !!categories && (
          <section>
            <Text variant="title1">
              {formatMessage(messages.importResultsCategoriesLabel)}:{' '}
            </Text>
            {categories}
          </section>
        )
      )}
      {loading && !products ? (
        <EntitySkeleton />
      ) : (
        !!products && (
          <section>
            <Text variant="title1">
              {formatMessage(messages.importResultsProductsLabel)}:{' '}
            </Text>
            {products}
          </section>
        )
      )}
      {loading && !skus ? (
        <EntitySkeleton />
      ) : (
        !!skus && (
          <section>
            <Text variant="title1">
              {formatMessage(messages.importResultsSkusLabel)}:{' '}
            </Text>
            {skus}
          </section>
        )
      )}
      {loading && !prices ? (
        <EntitySkeleton />
      ) : (
        !!prices && (
          <section>
            <Text variant="title1">
              {formatMessage(messages.importResultsPricesLabel)}:{' '}
            </Text>
            {prices}
          </section>
        )
      )}
      {loading && !stocks ? (
        <EntitySkeleton />
      ) : (
        !!stocks && (
          <section>
            <Text variant="title1">
              {formatMessage(messages.importResultsStocksLabel)}:{' '}
            </Text>
            {stocks}
          </section>
        )
      )}
    </Stack>
  )
}
