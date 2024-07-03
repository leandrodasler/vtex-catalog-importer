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
import type {
  Category,
  Import,
  Query,
  QueryGetImportArgs,
} from 'ssesandbox04.catalog-importer'
import { useRuntime } from 'vtex.render-runtime'

import {
  Checked,
  SuspenseFallback,
  Unchecked,
  useStatusLabel,
  useStockOptionLabel,
} from '../../../common'
import { GET_IMPORT_QUERY, useQueryCustom } from '../../../graphql'
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

  const { data, loading } = useQueryCustom<Query, QueryGetImportArgs>(
    GET_IMPORT_QUERY,
    {
      skip: !infoModal?.id,
      variables: { id: infoModal?.id as string },
    }
  )

  const folder = {
    name: '',
    children: [
      {
        name: 'Category Tree',
        children: data?.getImport.categoryTree.map(categoryTreeMapper) ?? [],
      },
    ],
  }

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
            <Text style={{ display: 'flex', gap: '0.5rem' }}>
              <h6>Source VTEX Account: </h6>
              {infoModal.settings.useDefault ? (
                <Text>Default</Text>
              ) : (
                <Text> {infoModal.settings.account}</Text>
              )}
            </Text>
            <Text style={{ display: 'flex', gap: '0.5rem' }}>
              <h6>ID:</h6> {infoModal.id}
            </Text>
            <Text style={{ display: 'flex', gap: '0.5rem' }}>
              <h6>Created In:</h6>
              {new Date(infoModal.createdIn).toLocaleString(locale)}
            </Text>
            <Text style={{ display: 'flex', gap: '0.5rem' }}>
              <h6> Last Interaction in:</h6>
              {new Date(infoModal.lastInteractionIn).toLocaleString(locale)}
            </Text>
            <Text style={{ display: 'flex', gap: '0.5rem' }}>
              <h6>User: </h6>
              {infoModal.user}
            </Text>
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
            <Text style={{ display: 'flex', gap: '0.5rem' }}>
              <h6>Import Images:</h6>
              {infoModal.importImages ? <Checked /> : <Unchecked />}
            </Text>
            <Text style={{ display: 'flex', gap: '0.5rem' }}>
              <h6> Import Prices:</h6>
              {infoModal.importPrices ? <Checked /> : <Unchecked />}
            </Text>
            {infoModal.stockValue && (
              <Text style={{ display: 'flex', gap: '0.5rem' }}>
                <h6>Stock to be defined for all SKUs:</h6>{' '}
                {infoModal.stockValue}
              </Text>
            )}
            <Text style={{ display: 'flex', gap: '0.5rem' }}>
              <h6>Stock Option: </h6>
              {getStockOptionLabel(infoModal.stocksOption).toLowerCase()}
            </Text>
            {infoModal.categoryTree && (
              <Text style={{ display: 'flex', gap: '0.5rem' }}>
                <h6>Category Tree:</h6> {infoModal.categoryTree}
              </Text>
            )}
            <Text style={{ display: 'flex', gap: '0.5rem' }}>
              <h6>Status:</h6>{' '}
              <Tag
                label={getStatusLabel(infoModal.status)}
                variant={mapStatusToVariant[infoModal.status]}
              />
            </Text>
            {infoModal.error && (
              <Text style={{ display: 'flex', gap: '0.5rem' }}>
                <h6>Error: </h6>
                {infoModal.error}
              </Text>
            )}
          </Stack>
        )}
      </ModalContent>
    </Modal>
  )
}
