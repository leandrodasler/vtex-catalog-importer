import {
  Modal,
  ModalContent,
  ModalDismiss,
  ModalHeader,
  ModalTitle,
  Stack,
  TBody,
  TBodyCell,
  TBodyRow,
  THead,
  THeadCell,
  Table,
  Text,
  csx,
  useModalState,
  useTableState,
} from '@vtex/admin-ui'
import React, { useMemo, useState } from 'react'
import { useIntl } from 'react-intl'
import type {
  Import,
  Query,
  QueryImportsArgs,
} from 'ssesandbox04.catalog-importer'

import {
  EmptyView,
  SuspenseFallback,
  goToWizardPage,
  messages,
} from '../../common'
import { IMPORTS_QUERY, useQueryCustom } from '../../graphql'
import useImportColumns from './useImportColumns'

const DEFAULT_ARGS = {
  page: 1,
  pageSize: 100,
  sort: 'createdIn desc',
  where: '',
}

export default function History() {
  const { formatMessage } = useIntl()
  const [deleted, setDeleted] = useState<string[]>([])
  const columns = useImportColumns({ setDeleted })
  const openInfosImportmodal = useModalState()
  const [infoModal, setInfoModal] = useState<Import>()

  // eslint-disable-next-line no-console
  console.log('infoModal', infoModal)

  const { data, loading } = useQueryCustom<Query, QueryImportsArgs>(
    IMPORTS_QUERY,
    { variables: { args: DEFAULT_ARGS } }
  )

  const imports = data?.imports.data
  const paginationTotal = data?.imports.pagination.total ?? 0

  const items = useMemo(
    () => imports?.filter((item: Import) => !deleted?.includes(item.id)) ?? [],
    [deleted, imports]
  )

  const pageSize = items?.length
  const total = useMemo(() => paginationTotal - deleted.length, [
    deleted,
    paginationTotal,
  ])

  const {
    data: tableData,
    getBodyCell,
    getHeadCell,
    getTable,
  } = useTableState<Import>({ columns, items })

  if (loading) {
    return <SuspenseFallback />
  }

  if (!total) {
    return (
      <EmptyView
        text={formatMessage(messages.wizardAction)}
        onClick={goToWizardPage}
      />
    )
  }

  return (
    <Stack
      space="$space-4"
      fluid
      className={csx({ maxWidth: '100%', overflow: 'auto' })}
    >
      <Text variant="detail" className={csx({ paddingLeft: '$space-4' })}>
        {formatMessage(messages.importPaginationLabel, { pageSize, total })}
      </Text>
      <Table {...getTable()}>
        <THead>
          {columns.map((column, index) => (
            <THeadCell
              {...getHeadCell(column)}
              key={`header-${index}`}
              className="b"
            />
          ))}
        </THead>
        <TBody>
          {tableData.map((item, index) => (
            <TBodyRow
              key={`row-${index}`}
              onClick={() => {
                openInfosImportmodal.show()
                setInfoModal(item)
                // eslint-disable-next-line no-console
                console.log('item onclick', item)
              }}
            >
              {columns.map((column, indexColumn) => (
                <TBodyCell
                  {...getBodyCell(column, item)}
                  key={`column-${indexColumn}`}
                />
              ))}
            </TBodyRow>
          ))}
        </TBody>
      </Table>
      <Modal state={openInfosImportmodal}>
        <ModalHeader>
          <ModalTitle>Modal title</ModalTitle>
          <ModalDismiss />
        </ModalHeader>
        <ModalContent>
          {infoModal && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Text>ID: {infoModal.id}</Text>
              <Text>
                Created In:{' '}
                {new Date(infoModal.createdIn).toLocaleDateString('pt-BR')}
              </Text>
              <Text>
                Last Interaction in:{' '}
                {new Date(infoModal.lastInteractionIn).toLocaleDateString(
                  'pt-BR'
                )}
              </Text>
              <Text>User: {infoModal.user}</Text>
              <Text>Import Images: {infoModal.importImages}</Text>
              <Text>Import Prices: {infoModal.importPrices}</Text>
              <Text>Stock Value: {infoModal.stockValue}</Text>
              <Text>Stock Option: {infoModal.stocksOption}</Text>
              <Text>Category Tree: {infoModal.categoryTree}</Text>
              <Text>Status: {infoModal.status}</Text>
              <Text>Settings: {JSON.stringify(infoModal.settings)}</Text>
            </div>
          )}
        </ModalContent>
      </Modal>
    </Stack>
  )
}
