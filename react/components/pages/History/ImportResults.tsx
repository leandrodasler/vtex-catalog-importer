import { Stack, Text } from '@vtex/admin-ui'
import React from 'react'
import { useIntl } from 'react-intl'
import type { ImportProgress } from 'ssesandbox04.catalog-importer'

import { ErrorMessage, messages, useEntityLabel } from '../../common'
import ImportEntityResult from './ImportEntityResult'

type Props = { importProgress?: ImportProgress; loading: boolean }

const ImportResults = ({ importProgress, loading }: Props) => {
  const { formatMessage } = useIntl()
  const getEntityLabel = useEntityLabel()

  if (!importProgress) {
    return null
  }

  const {
    currentImport: {
      error,
      entityError,
      currentEntity,
      sourceCategoriesTotal,
      sourceProductsTotal,
      sourceSkusTotal,
      sourcePricesTotal,
      sourceStocksTotal,
    },
    categories,
    products,
    skus,
    prices,
    stocks,
  } = importProgress

  const total = +categories + +products + +skus + +prices + +stocks

  const errorTitle = getEntityLabel(entityError)

  return (
    <Stack space="$space-2" fluid>
      <Text variant="title1">{formatMessage(messages.importResultsLabel)}</Text>
      {error && (!entityError || entityError === 'category') && (
        <ErrorMessage error={error} title={errorTitle} />
      )}
      <ImportEntityResult
        title={formatMessage(messages.importResultsCATEGORYLabel)}
        current={categories}
        total={sourceCategoriesTotal}
        loading={loading}
        isCurrent={currentEntity === 'category'}
      />
      {error && entityError === 'product' && (
        <ErrorMessage error={error} title={errorTitle} />
      )}
      <ImportEntityResult
        title={formatMessage(messages.importResultsPRODUCTLabel)}
        current={products}
        total={sourceProductsTotal}
        loading={loading}
        isCurrent={currentEntity === 'product'}
      />
      {error && entityError === 'sku' && (
        <ErrorMessage error={error} title={errorTitle} />
      )}
      <ImportEntityResult
        title={formatMessage(messages.importResultsSKULabel)}
        current={skus}
        total={sourceSkusTotal}
        loading={loading}
        isCurrent={currentEntity === 'sku'}
      />
      {error && entityError === 'price' && (
        <ErrorMessage error={error} title={errorTitle} />
      )}
      <ImportEntityResult
        title={formatMessage(messages.importResultsPRICELabel)}
        current={prices}
        total={sourcePricesTotal}
        loading={loading}
        isCurrent={currentEntity === 'price'}
      />
      {error && entityError === 'stock' && (
        <ErrorMessage error={error} title={errorTitle} />
      )}
      <ImportEntityResult
        title={formatMessage(messages.importResultsSTOCKLabel)}
        current={stocks}
        total={sourceStocksTotal}
        loading={loading}
        isCurrent={currentEntity === 'stock'}
      />
      <Text variant="title1">
        {formatMessage(messages.importResultsTotalLabel, { total })}
      </Text>
    </Stack>
  )
}

export default ImportResults
