import type { useModalState } from '@vtex/admin-ui'
import {
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
import { flattenTree } from 'react-accessible-treeview'
import { useIntl } from 'react-intl'
import type {
  Entity,
  Import,
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
  categoryTreeMapper,
  messages,
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
  infoModal?: Import
}

export const ShowImportModal: React.FC<ShowImportModalProps> = ({
  openInfosImportmodal,
  infoModal,
}) => {
  const {
    culture: { locale },
  } = useRuntime()

  const { formatMessage } = useIntl()
  const getStockOptionLabel = useStockOptionLabel()
  const getStatusLabel = useStatusLabel()

  const { data, loading: loadingImport } = useQueryCustom<
    Query,
    QueryGetImportArgs
  >(GET_IMPORT_QUERY, {
    skip: !infoModal?.id,
    variables: { id: infoModal?.id as string },
  })

  const { data: brandsData, loading: loadingEntities } = useQueryCustom<
    Query,
    QueryGetEntitiesArgs
  >(GET_ENTITIES_QUERY, {
    skip: !infoModal?.id,
    variables: { importId: infoModal?.id as string, entityName: 'brand' },
  })

  const categories = useMemo(() => data?.getImport.categoryTree ?? [], [
    data?.getImport.categoryTree,
  ])

  const brands = useMemo(() => brandsData?.getEntities ?? [], [
    brandsData?.getEntities,
  ])

  const brandsFolder = useMemo(
    () =>
      flattenTree({
        name: '',
        children: [
          {
            name: formatMessage(messages.importBrandsLabel, {
              total: brands.length,
            }),
            children: brands.map(({ id, payload }: Entity) => ({
              name: JSON.parse(payload).Name,
              id,
            })),
          },
        ],
      }),
    [brands, formatMessage]
  )

  const categoryTreeFolder = useMemo(
    () =>
      flattenTree({
        name: '',
        children: [
          {
            name: formatMessage(messages.optionsCategories),
            children: categories.map(categoryTreeMapper) ?? [],
          },
        ],
      }),
    [categories, formatMessage]
  )

  const loading = useMemo(() => loadingEntities || loadingImport, [
    loadingEntities,
    loadingImport,
  ])

  return (
    <Modal state={openInfosImportmodal}>
      <ModalHeader>
        <ModalTitle>{formatMessage(messages.importDetailsLabel)}:</ModalTitle>
        <ModalDismiss />
      </ModalHeader>
      <ModalContent>
        {loading && <SuspenseFallback />}
        {!loading && infoModal && (
          <Stack space="$space-2" fluid>
            <Stack direction="row">
              <Text variant="title1">
                {formatMessage(messages.settingsAccountLabel)}:
              </Text>
              {infoModal.settings.useDefault ? (
                <Stack direction="row">
                  {formatMessage(messages.settingsDefaultShort)}
                </Stack>
              ) : (
                <Stack> {infoModal.settings.account}</Stack>
              )}
            </Stack>
            <Stack direction="row">
              <Text variant="title1">ID:</Text>
              <Text variant="body">{infoModal.id}</Text>
            </Stack>
            <Stack direction="row">
              <Text variant="title1">
                {formatMessage(messages.importCreatedInLabel)}:
              </Text>
              <Text variant="body">
                {new Date(infoModal.createdIn).toLocaleString(locale)}
              </Text>
            </Stack>
            <Stack direction="row">
              <Text variant="title1">
                {formatMessage(messages.importLastInteractionInLabel)}:
              </Text>

              <Text variant="body">
                {new Date(infoModal.lastInteractionIn).toLocaleString(locale)}
              </Text>
            </Stack>
            <Stack direction="row">
              <Text variant="title1">
                {formatMessage(messages.importUserLabel)}:
              </Text>
              <Text variant="body">{infoModal.user}</Text>
            </Stack>
            {categoryTreeFolder.length && <Tree data={categoryTreeFolder} />}
            <Stack direction="row">
              <Text variant="title1">
                {formatMessage(messages.importImage)}:
              </Text>
              <Text variant="body">
                {infoModal.importImages ? <Checked /> : <Unchecked />}
              </Text>
            </Stack>
            <Stack direction="row">
              <Text variant="title1">
                {formatMessage(messages.importPrice)}:
              </Text>
              <Text variant="body">
                {infoModal.importPrices ? <Checked /> : <Unchecked />}
              </Text>
            </Stack>
            {infoModal.stockValue && (
              <Stack direction="row">
                <Text variant="title1">
                  {formatMessage(messages.stockValue)}:
                </Text>
                <Text variant="body">{infoModal.stockValue}</Text>
              </Stack>
            )}
            <Stack direction="row">
              <Text variant="title1">
                {formatMessage(messages.importStocks)}:
              </Text>
              <Text variant="body">
                {getStockOptionLabel(infoModal.stocksOption).toLowerCase()}
              </Text>
            </Stack>
            <Stack direction="row">
              <Text variant="title1">
                {formatMessage(messages.importStatusLabel)}:
              </Text>
              <Tag
                label={getStatusLabel(infoModal.status)}
                variant={mapStatusToVariant[infoModal.status]}
              />
            </Stack>
            {infoModal.error && (
              <Stack direction="row">
                <Text variant="body">{infoModal.error}</Text>
              </Stack>
            )}
            <Tree data={brandsFolder} />
          </Stack>
        )}
      </ModalContent>
    </Modal>
  )
}
