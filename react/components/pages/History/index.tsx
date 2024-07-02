import {
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
import React, { useEffect, useMemo, useState } from 'react'
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
import { ConfirmeModal, DeleteConfirmationModal } from './common/modalComponent'
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
  const openInfosImportmodal = useModalState()
  const openDeleteConfirmationModal = useModalState()
  const [infoModal, setInfoModal] = useState<Import>()
  const [deleteId, setDeleteId] = useState<string | undefined>()

  const columns = useImportColumns({
    setDeleted,
    openInfosImportmodal,
    setInfoModal,
    openDeleteConfirmationModal,
    setDeleteId,
  })

  const { data, loading } = useQueryCustom<Query, QueryImportsArgs>(
    IMPORTS_QUERY,
    { variables: { args: DEFAULT_ARGS } }
  )

  const imports = data?.imports.data

  useEffect(() => {
    const url = new URL(window.parent.location.href)
    const id = url.searchParams.get('id')

    if (!id || !imports?.length) {
      return
    }

    const importToOpen = imports.find((item: Import) => item.id === id)

    if (
      !importToOpen ||
      (!openInfosImportmodal.open && importToOpen.id === infoModal?.id)
    ) {
      url.searchParams.delete('id')
      window.parent.history.replaceState(null, '', url.toString())

      return
    }

    setInfoModal(importToOpen)
    openInfosImportmodal.show()
  }, [imports, infoModal, openInfosImportmodal])

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
                const url = new URL(window.parent.location.href)

                url.searchParams.set('id', item.id)
                window.parent.history.replaceState(null, '', url.toString())
                openInfosImportmodal.show()
                setInfoModal(item)
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
      <ConfirmeModal
        openInfosImportmodal={openInfosImportmodal}
        infoModal={infoModal}
      />
      <DeleteConfirmationModal
        openDeleteConfirmationModal={openDeleteConfirmationModal}
        deleteId={deleteId}
        setDeleted={setDeleted}
      />
    </Stack>
  )
}
