import { Card, csx, cx, Inline, Stack, Text } from '@vtex/admin-ui'
import React from 'react'
import { useIntl } from 'react-intl'
import type { ImportProgress } from 'ssesandbox04.catalog-importer'

import { Checked, Loading, messages, Unchecked } from '../../common'
import { EntitySkeleton, useLocalePercentage } from './common'

type Props = { importProgress?: ImportProgress; loading: boolean }

const ENTITIES_DEFAULT = {
  brands: 0,
  categories: 0,
  products: 0,
  skus: 0,
  prices: 0,
  stocks: 0,
}

const resultCardTheme = csx({ position: 'relative', height: 32 })
const resultSkeletonTheme = csx({ width: '100%', position: 'absolute' })
const resultDetailTheme = cx(resultSkeletonTheme, csx({ padding: '$space-05' }))
const totalizerTheme = csx({
  lineHeight: 'var(--admin-ui-text-title1-lineHeight)',
})

const ImportResults = ({ importProgress, loading }: Props) => {
  const { formatMessage } = useIntl()
  const getPercentage = useLocalePercentage()
  const currentImport = importProgress?.currentImport

  if (!currentImport) {
    return null
  }

  const {
    sourceBrandsTotal,
    /* TODO: sourceCategoriesTotal, sourceProductsTotal, sourceSkusTotal, sourcePricesTotal, sourceStocksTotal */
  } = currentImport

  const importEntities = importProgress ?? ENTITIES_DEFAULT
  const { brands, categories, products, skus, prices, stocks } = importEntities

  const percentageBrands = sourceBrandsTotal
    ? getPercentage(brands / sourceBrandsTotal)
    : '0%'

  return (
    <Stack space="$space-2" fluid>
      <Text variant="title1">{formatMessage(messages.importResultsLabel)}</Text>
      {currentImport.error && (
        <section>
          <Text tone="critical">{currentImport.error}</Text>
        </section>
      )}
      {loading && !brands ? (
        <EntitySkeleton />
      ) : (
        !!sourceBrandsTotal && (
          <section>
            <Card className={resultCardTheme}>
              {percentageBrands !== '100%' && (
                <div className={resultSkeletonTheme}>
                  <EntitySkeleton width={percentageBrands} />
                </div>
              )}
              <Inline align="center" className={resultDetailTheme}>
                {percentageBrands === '100%' && <Checked />}
                {percentageBrands !== '100%' && loading && <Loading />}
                {percentageBrands !== '100%' && !loading && <Unchecked />}
                <Text variant="title1">
                  {formatMessage(messages.importResultsBrandsLabel)}:{' '}
                </Text>
                <span className={totalizerTheme}>
                  {brands} / {sourceBrandsTotal}
                </span>
              </Inline>
            </Card>
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

export default ImportResults
