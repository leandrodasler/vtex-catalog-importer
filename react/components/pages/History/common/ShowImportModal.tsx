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
  QueryGetEntitiesArgs,
  QueryGetImportArgs,
} from 'ssesandbox04.catalog-importer'
import { useRuntime } from 'vtex.render-runtime'

import type { ImportChangedStatus } from '.'
import {
  Checked,
  SuspenseFallback,
  Tree,
  Unchecked,
  brandsTreeMapper,
  categoryTreeMapper,
  messages,
  treeSorter,
  useStatusLabel,
  useStockOptionLabel,
} from '../../../common'
import {
  GET_ENTITIES_QUERY,
  GET_IMPORT_QUERY,
  useQueryCustom,
} from '../../../graphql'
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
  } = useQueryCustom<Query, QueryGetImportArgs>(GET_IMPORT_QUERY, {
    fetchPolicy: 'network-only',
    skip: !id,
    variables: { id },
    onCompleted(result) {
      const { status } = result.getImport

      setChangedStatus((prev) => ({ ...prev, [id]: status }))

      if (status === 'PENDING' || status === 'RUNNING') {
        startPollingImport(3000)
      } else {
        stopPollingImport()
      }
    },
  })

  const importExecution = data?.getImport
  const status = importExecution?.status

  const {
    data: brandsData,
    loading: loadingBrands,
    startPolling: startPollingBrands,
    stopPolling: stopPollingBrands,
  } = useQueryCustom<Query, QueryGetEntitiesArgs>(GET_ENTITIES_QUERY, {
    fetchPolicy: 'network-only',
    skip: !id,
    variables: { importId: id, entityName: 'brand' },
    onCompleted() {
      if (status === 'PENDING' || status === 'RUNNING') {
        startPollingBrands(1000)
      } else {
        stopPollingBrands()
      }
    },
  })

  const loading = useMemo(
    () =>
      loadingImport ||
      loadingBrands ||
      status === 'PENDING' ||
      status === 'RUNNING',
    [loadingBrands, loadingImport, status]
  )

  const categories = useMemo(
    () =>
      data?.getImport.categoryTree.sort(treeSorter).map(categoryTreeMapper) ??
      [],
    [data?.getImport.categoryTree]
  )

  const brands = useMemo(
    () => brandsData?.getEntities.map(brandsTreeMapper).sort(treeSorter) ?? [],
    [brandsData?.getEntities]
  )

  const beforeLoaded = useMemo(
    () => importExecution && brandsData?.getEntities,
    [brandsData?.getEntities, importExecution]
  )

  return (
    <Modal state={openInfosImportmodal} size="large">
      <ModalHeader>
        <ModalTitle>{formatMessage(messages.importDetailsLabel)}</ModalTitle>
        <Stack direction="row" space="$space-2">
          {loading && beforeLoaded && <Spinner />}
          <ModalDismiss />
        </Stack>
      </ModalHeader>
      <ModalContent>
        {loading && !beforeLoaded && <SuspenseFallback />}
        {importExecution && beforeLoaded && (
          <Columns space={{ mobile: '$space-0', tablet: '$space-2' }}>
            <Column
              units={{ mobile: 12, tablet: 6 }}
              className={firstColumnTheme}
            >
              <Stack space="$space-2" fluid>
                <Stack direction="row">
                  <Text variant="title1">
                    {formatMessage(messages.settingsAccountLabel)}:
                  </Text>
                  {importExecution.settings.useDefault ? (
                    <Stack direction="row">
                      {formatMessage(messages.settingsDefaultShort)}
                    </Stack>
                  ) : (
                    <Stack> {importExecution.settings.account}</Stack>
                  )}
                </Stack>
                <Stack direction="row">
                  <Text variant="title1">ID:</Text>
                  <Text variant="body">{importExecution.id}</Text>
                </Stack>
                <Stack direction="row">
                  <Text variant="title1">
                    {formatMessage(messages.importCreatedInLabel)}:
                  </Text>
                  <Text variant="body">
                    {new Date(importExecution.createdIn).toLocaleString(locale)}
                  </Text>
                </Stack>
                <Stack direction="row">
                  <Text variant="title1">
                    {formatMessage(messages.importLastInteractionInLabel)}:
                  </Text>

                  <Text variant="body">
                    {new Date(importExecution.lastInteractionIn).toLocaleString(
                      locale
                    )}
                  </Text>
                </Stack>
                <Stack direction="row">
                  <Text variant="title1">
                    {formatMessage(messages.importUserLabel)}:
                  </Text>
                  <Text variant="body">{importExecution.user}</Text>
                </Stack>
                {categories.length && (
                  <Tree
                    data={categories}
                    title={formatMessage(messages.optionsCategories)}
                  />
                )}
                <Stack direction="row">
                  <Text variant="title1">
                    {formatMessage(messages.importImage)}
                  </Text>
                  <Text variant="body">
                    {importExecution.importImages ? <Checked /> : <Unchecked />}
                  </Text>
                </Stack>
                <Stack direction="row">
                  <Text variant="title1">
                    {formatMessage(messages.importPrice)}
                  </Text>
                  <Text variant="body">
                    {importExecution.importPrices ? <Checked /> : <Unchecked />}
                  </Text>
                </Stack>
                {importExecution.stockValue && (
                  <Stack direction="row">
                    <Text variant="title1">
                      {formatMessage(messages.stockValue)}:
                    </Text>
                    <Text variant="body">{importExecution.stockValue}</Text>
                  </Stack>
                )}
                <Stack direction="row">
                  <Text variant="title1">
                    {formatMessage(messages.importStocks)}:
                  </Text>
                  <Text variant="body">
                    {getStockOptionLabel(
                      importExecution.stocksOption
                    ).toLowerCase()}
                  </Text>
                </Stack>
                <Stack direction="row">
                  <Text variant="title1">
                    {formatMessage(messages.importStatusLabel)}:
                  </Text>
                  <Tag
                    label={getStatusLabel(importExecution.status)}
                    variant={mapStatusToVariant[importExecution.status]}
                  />
                </Stack>
                {importExecution.error && (
                  <Stack direction="row">
                    <Text variant="body" tone="critical">
                      {importExecution.error}
                    </Text>
                  </Stack>
                )}
              </Stack>
            </Column>
            <Column
              units={{ mobile: 12, tablet: 6 }}
              className={secondColumnTheme}
            >
              <Stack space="$space-2" fluid>
                <Text variant="title2">
                  {formatMessage(messages.importResultsLabel)}:
                </Text>
                <Tree
                  data={brands}
                  title={formatMessage(messages.importBrandsLabel, {
                    total: brands.length,
                  })}
                />
              </Stack>
            </Column>
          </Columns>
        )}
      </ModalContent>
    </Modal>
  )
}
