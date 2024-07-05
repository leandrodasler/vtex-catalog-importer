import type { useModalState } from '@vtex/admin-ui'
import {
  Flex,
  IconCaretDown,
  IconCaretRight,
  Modal,
  ModalContent,
  ModalDismiss,
  ModalHeader,
  ModalTitle,
  Stack,
  Tag,
  Text,
  csx,
} from '@vtex/admin-ui'
import React from 'react'
import TreeView, { flattenTree } from 'react-accessible-treeview'
import { useIntl } from 'react-intl'
import type {
  Category,
  Import,
  Query,
  QueryGetEntitiesArgs,
  QueryGetImportArgs,
} from 'ssesandbox04.catalog-importer'
import { useRuntime } from 'vtex.render-runtime'

import {
  Checked,
  SuspenseFallback,
  Unchecked,
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

type ConfirmeModalProps = {
  openInfosImportmodal: ReturnType<typeof useModalState>
  infoModal?: Import
}

type CategoryWithChildren = Category & { children: CategoryWithChildren[] }

const categoryTreeMapper: (category: Category) => CategoryWithChildren = ({
  id,
  name,
  children,
}) => ({
  id,
  name,
  children: children?.length ? children.map(categoryTreeMapper) : [],
})

const treeNodeTheme = csx({
  '.tree, .tree-node, .tree-node-group': { listStyleType: 'none' },
  '.tree-node': { cursor: 'pointer' },
  '> .tree > .tree-branch-wrapper > .tree-node > .name': { fontWeight: 'bold' },
})

export const ShowImportModal: React.FC<ConfirmeModalProps> = ({
  openInfosImportmodal,
  infoModal,
}) => {
  const {
    culture: { locale },
  } = useRuntime()

  const { formatMessage } = useIntl()

  const { data, loading: loadingImport } = useQueryCustom<
    Query,
    QueryGetImportArgs
  >(GET_IMPORT_QUERY, {
    skip: !infoModal?.id,
    variables: { id: infoModal?.id as string },
  })

  const { data: entities, loading: loadingEntities } = useQueryCustom<
    Query,
    QueryGetEntitiesArgs
  >(GET_ENTITIES_QUERY, {
    skip: !infoModal?.id,
    variables: { importId: infoModal?.id as string, entityName: 'brand' },
  })

  const folder = {
    name: '',
    children: [
      {
        name: 'Category Tree',
        children: data?.getImport.categoryTree.map(categoryTreeMapper) ?? [],
      },
    ],
  }

  const loading = loadingImport || loadingEntities
  const categoryTree = flattenTree(folder)
  const getStockOptionLabel = useStockOptionLabel()
  const getStatusLabel = useStatusLabel()

  return (
    <Modal state={openInfosImportmodal}>
      <ModalHeader>
        <ModalTitle>Import Details</ModalTitle>
        <ModalDismiss />
      </ModalHeader>
      <ModalContent>
        {loading && <SuspenseFallback />}
        {!loading && infoModal && (
          <Stack space="$space-2">
            <Stack direction="row">
              <Text variant="title1">
                {formatMessage(messages.settingsAccountLabel)}:
              </Text>
              {infoModal.settings.useDefault ? (
                <Stack direction="row">Default</Stack>
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
            {categoryTree.length && (
              <div className={treeNodeTheme}>
                <TreeView
                  data={categoryTree}
                  nodeRenderer={({
                    element,
                    isBranch,
                    isExpanded,
                    getNodeProps,
                    level,
                    handleExpand,
                  }) => {
                    return (
                      <Flex
                        align="center"
                        {...getNodeProps({ onClick: handleExpand })}
                        style={{ marginLeft: 30 * (level - 1) }}
                      >
                        {!isBranch && (
                          <IconCaretRight size="small" style={{ opacity: 0 }} />
                        )}
                        {isBranch && !isExpanded && (
                          <IconCaretRight size="small" />
                        )}
                        {isBranch && isExpanded && (
                          <IconCaretDown size="small" />
                        )}
                        <span className="name">{element.name}</span>
                      </Flex>
                    )
                  }}
                />
              </div>
            )}
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
            {infoModal.categoryTree && (
              <Stack>
                <Text variant="title1">Category Tree:</Text>
                <Text variant="title1">{infoModal.categoryTree}</Text>
              </Stack>
            )}
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
                <Text variant="title1">
                  {formatMessage(messages.importStatusERRORLabel)}:
                </Text>
                <Text variant="body">{infoModal.error}</Text>
              </Stack>
            )}
            <Text style={{ display: 'flex', gap: '0.5rem' }}>
              <h6>Brands imported</h6>
              {entities?.getEntities.length}
            </Text>
            <textarea style={{ width: '100%', height: 350 }}>
              {JSON.stringify(entities?.getEntities ?? [], null, 2)}
            </textarea>
          </Stack>
        )}
      </ModalContent>
    </Modal>
  )
}
