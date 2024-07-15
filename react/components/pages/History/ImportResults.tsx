import { Stack, Text } from '@vtex/admin-ui'
import React from 'react'
import { useIntl } from 'react-intl'
import type { ImportProgress } from 'ssesandbox04.catalog-importer'

import { messages } from '../../common'
import ImportEntityResult from './ImportEntityResult'

type Props = { importProgress?: ImportProgress; loading: boolean }

const ENTITIES_DEFAULT = {
  brands: 0,
  categories: 0,
  products: 0,
  skus: 0,
  prices: 0,
  stocks: 0,
}

const ImportResults = ({ importProgress, loading }: Props) => {
  const { formatMessage } = useIntl()
  const currentImport = importProgress?.currentImport

  if (!currentImport) {
    return null
  }

  const {
    sourceBrandsTotal,
    sourceCategoriesTotal,
    sourceProductsTotal,
    sourceSkusTotal,
    sourcePricesTotal,
    sourceStocksTotal,
  } = currentImport

  const importEntities = importProgress ?? ENTITIES_DEFAULT
  const { brands, categories, products, skus, prices, stocks } = importEntities

  return (
    <Stack space="$space-2" fluid>
      <Text variant="title1">{formatMessage(messages.importResultsLabel)}</Text>
      {currentImport.error && (
        <section>
          <Text tone="critical">{currentImport.error}</Text>
        </section>
      )}
      <ImportEntityResult
        title={formatMessage(messages.importResultsBrandsLabel)}
        current={brands}
        total={sourceBrandsTotal}
        loading={loading}
      />
      <ImportEntityResult
        title={formatMessage(messages.importResultsCategoriesLabel)}
        current={categories}
        total={sourceCategoriesTotal}
        loading={loading}
      />
      <ImportEntityResult
        title={formatMessage(messages.importResultsProductsLabel)}
        current={products}
        total={sourceProductsTotal}
        loading={loading}
      />
      <ImportEntityResult
        title={formatMessage(messages.importResultsSkusLabel)}
        current={skus}
        total={sourceSkusTotal}
        loading={loading}
      />
      <ImportEntityResult
        title={formatMessage(messages.importResultsPricesLabel)}
        current={prices}
        total={sourcePricesTotal}
        loading={loading}
      />
      <ImportEntityResult
        title={formatMessage(messages.importResultsStocksLabel)}
        current={stocks}
        total={sourceStocksTotal}
        loading={loading}
      />
    </Stack>
  )
}

export default ImportResults
