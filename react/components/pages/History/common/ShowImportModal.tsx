import type { useModalState } from '@vtex/admin-ui'
import {
  Column,
  Columns,
  Modal,
  ModalContent,
  ModalDismiss,
  ModalHeader,
  ModalTitle,
  Spinner,
  Stack,
  Tag,
  Text,
  csx,
} from '@vtex/admin-ui'
import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'
import type {
  Query,
  QueryImportProgressArgs,
} from 'ssesandbox04.catalog-importer'
import { useRuntime } from 'vtex.render-runtime'

import type { ImportChangedStatus } from '.'
import {
  Checked,
  SuspenseFallback,
  Tree,
  Unchecked,
  categoryTreeMapper,
  messages,
  treeSorter,
  useStatusLabel,
  useStockOptionLabel,
} from '../../../common'
import { IMPORT_PROGRESS_QUERY, useQueryCustom } from '../../../graphql'
import { mapStatusToVariant } from '../useImportColumns'

type ShowImportModalProps = {
  openInfosImportmodal: ReturnType<typeof useModalState>
  setChangedStatus: React.Dispatch<
    React.SetStateAction<ImportChangedStatus | undefined>
  >
  id: string
}

const firstColumnTheme = csx({
  borderBottom: '1px solid $gray20',
  paddingBottom: '$space-2',
  marginBottom: '$space-2',
  '@tablet': {
    paddingRight: '$space-2',
    border: 'none',
    borderRight: '1px solid $gray20',
  },
})

const secondColumnTheme = csx({ overflow: 'auto' })
const POLLING_INTERVAL = 3000

export const ShowImportModal: React.FC<ShowImportModalProps> = ({
  openInfosImportmodal,
  setChangedStatus,
  id,
}) => {
  const {
    culture: { locale },
  } = useRuntime()

  const { formatMessage } = useIntl()
  const getStockOptionLabel = useStockOptionLabel()
  const getStatusLabel = useStatusLabel()

  const {
    data,
    loading: loadingImport,
    startPolling: startPollingImport,
    stopPolling: stopPollingImport,
  } = useQueryCustom<Query, QueryImportProgressArgs>(IMPORT_PROGRESS_QUERY, {
    fetchPolicy: 'network-only',
    skip: !id,
    variables: { id },
    onCompleted(result) {
      const { status } = result.importProgress.currentImport

      setChangedStatus((prev) => ({ ...prev, [id]: status }))

      if (status === 'PENDING' || status === 'RUNNING') {
        startPollingImport(POLLING_INTERVAL)
      } else {
        stopPollingImport()
      }
    },
  })

  const importExecution = data?.importProgress.currentImport
  const status = importExecution?.status

  const importProgress = data?.importProgress ?? {
    brands: 0,
    categories: 0,
    products: 0,
    skus: 0,
    prices: 0,
    stocks: 0,
  }

  const { brands, categories, products, skus, prices, stocks } = importProgress

  const loading = useMemo(
    () => loadingImport || status === 'PENDING' || status === 'RUNNING',
    [loadingImport, status]
  )

  const categoryTree = useMemo(
    () =>
      importExecution?.categoryTree.sort(treeSorter).map(categoryTreeMapper) ??
      [],
    [importExecution?.categoryTree]
  )

  return (
    <Modal state={openInfosImportmodal} size="large">
      <ModalHeader>
        <ModalTitle>{formatMessage(messages.importDetailsLabel)}</ModalTitle>
        <Stack direction="row" space="$space-4">
          {loading && importExecution && <Spinner />}
          <ModalDismiss />
        </Stack>
      </ModalHeader>
      <ModalContent>
        {loading && !importExecution && <SuspenseFallback />}
        {importExecution && (
          <Columns space={{ mobile: '$space-0', tablet: '$space-2' }}>
            <Column
              units={{ mobile: 12, tablet: 6 }}
              className={firstColumnTheme}
            >
              <Stack space="$space-2" fluid>
                <section>
                  <Text variant="title1">
                    {formatMessage(messages.importStatusLabel)}:{' '}
                  </Text>
                  <Tag
                    label={getStatusLabel(importExecution.status)}
                    variant={mapStatusToVariant[importExecution.status]}
                  />
                </section>
                {importExecution.error && (
                  <section>
                    <Text tone="critical">{importExecution.error}</Text>
                  </section>
                )}
                <section>
                  <Text variant="title1">
                    {formatMessage(messages.settingsAccountLabel)}:{' '}
                  </Text>
                  {importExecution.settings.useDefault
                    ? formatMessage(messages.settingsDefaultShort)
                    : importExecution.settings.account}
                </section>
                <section>
                  <Text variant="title1">ID: </Text>
                  {importExecution.id}
                </section>
                <section>
                  <Text variant="title1">
                    {formatMessage(messages.importCreatedInLabel)}:{' '}
                  </Text>
                  {new Date(importExecution.createdIn).toLocaleString(locale)}
                </section>
                <section>
                  <Text variant="title1">
                    {formatMessage(messages.importLastInteractionInLabel)}:{' '}
                  </Text>
                  {new Date(importExecution.lastInteractionIn).toLocaleString(
                    locale
                  )}
                </section>
                <section>
                  <Text variant="title1">
                    {formatMessage(messages.importUserLabel)}:{' '}
                  </Text>
                  {importExecution.user}
                </section>
                <section>
                  <Stack direction="row">
                    <Text variant="title1">
                      {formatMessage(messages.importImage)}
                    </Text>
                    {importExecution.importImages ? <Checked /> : <Unchecked />}
                  </Stack>
                </section>
                <section>
                  <Stack direction="row">
                    <Text variant="title1">
                      {formatMessage(messages.importPrice)}
                    </Text>
                    {importExecution.importPrices ? <Checked /> : <Unchecked />}
                  </Stack>
                </section>
                {importExecution.stockValue && (
                  <section>
                    <Text variant="title1">
                      {formatMessage(messages.stockValue)}:{' '}
                    </Text>
                    {importExecution.stockValue}
                  </section>
                )}
                <section>
                  <Text variant="title1">
                    {formatMessage(messages.importStocks)}:{' '}
                  </Text>
                  {getStockOptionLabel(importExecution.stocksOption)}
                </section>
                {categoryTree.length && (
                  <section>
                    <Tree
                      data={categoryTree}
                      title={formatMessage(messages.optionsCategories)}
                    />
                  </section>
                )}
              </Stack>
            </Column>
            <Column
              units={{ mobile: 12, tablet: 6 }}
              className={secondColumnTheme}
            >
              <Stack space="$space-2" fluid>
                <Text variant="title1" tone="info">
                  {formatMessage(messages.importResultsLabel)}
                </Text>
                {!!brands && (
                  <section>
                    <Text variant="title1">
                      {formatMessage(messages.importResultsBrandsLabel)}:{' '}
                    </Text>
                    {brands}
                  </section>
                )}
                {!!categories && (
                  <section>
                    <Text variant="title1">
                      {formatMessage(messages.importResultsCategoriesLabel)}:{' '}
                    </Text>
                    {categories}
                  </section>
                )}
                {!!products && (
                  <section>
                    <Text variant="title1">
                      {formatMessage(messages.importResultsProductsLabel)}:{' '}
                    </Text>
                    {products}
                  </section>
                )}
                {!!skus && (
                  <section>
                    <Text variant="title1">
                      {formatMessage(messages.importResultsSkusLabel)}:{' '}
                    </Text>
                    {skus}
                  </section>
                )}
                {!!prices && (
                  <section>
                    <Text variant="title1">
                      {formatMessage(messages.importResultsPricesLabel)}:{' '}
                    </Text>
                    {prices}
                  </section>
                )}
                {!!stocks && (
                  <section>
                    <Text variant="title1">
                      {formatMessage(messages.importResultsStocksLabel)}:{' '}
                    </Text>
                    {stocks}
                  </section>
                )}
              </Stack>
            </Column>
          </Columns>
        )}
      </ModalContent>
    </Modal>
  )
}
