import type { useModalState } from '@vtex/admin-ui'
import {
  Button,
  IconArrowsClockwise,
  Modal,
  ModalContent,
  ModalDismiss,
  ModalHeader,
  ModalTitle,
  Stack,
  Tag,
  Text,
} from '@vtex/admin-ui'
import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'
import type {
  Query,
  QueryGetEntitiesArgs,
  QueryGetImportArgs,
} from 'ssesandbox04.catalog-importer'
import { useRuntime } from 'vtex.render-runtime'

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
  id: string
}

export const ShowImportModal: React.FC<ShowImportModalProps> = ({
  openInfosImportmodal,
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
    refetch: refetchImport,
  } = useQueryCustom<Query, QueryGetImportArgs>(GET_IMPORT_QUERY, {
    skip: !id,
    variables: { id },
  })

  const importExecution = data?.getImport

  const {
    data: brandsData,
    loading: loadingBrands,
    refetch: refetchBrands,
  } = useQueryCustom<Query, QueryGetEntitiesArgs>(GET_ENTITIES_QUERY, {
    skip: !id,
    variables: { importId: id, entityName: 'brand' },
  })

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

  const loading = useMemo(() => loadingBrands || loadingImport, [
    loadingBrands,
    loadingImport,
  ])

  const refetchAll = () => {
    refetchBrands()
    refetchImport()
  }

  return (
    <Modal state={openInfosImportmodal}>
      <ModalHeader>
        <ModalTitle>{formatMessage(messages.importDetailsLabel)}</ModalTitle>
        <Stack direction="row" space="$space-1">
          <Button
            disabled={loading}
            icon={<IconArrowsClockwise />}
            onClick={() => refetchAll()}
            variant="tertiary"
          >
            {formatMessage(messages.categoriesRefreshLabel)}
          </Button>
          <ModalDismiss />
        </Stack>
      </ModalHeader>
      <ModalContent>
        {loading && <SuspenseFallback />}
        {!loading && importExecution && (
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
                {formatMessage(messages.importImage)}:
              </Text>
              <Text variant="body">
                {importExecution.importImages ? <Checked /> : <Unchecked />}
              </Text>
            </Stack>
            <Stack direction="row">
              <Text variant="title1">
                {formatMessage(messages.importPrice)}:
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
                <Text variant="body">{importExecution.error}</Text>
              </Stack>
            )}
            <Tree
              data={brands}
              title={formatMessage(messages.importBrandsLabel, {
                total: brands.length,
              })}
            />
          </Stack>
        )}
      </ModalContent>
    </Modal>
  )
}
