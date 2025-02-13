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
import { statusBeforeFinished } from './common'
import ShowImportModal from './ShowImportModal'
import useImportColumns from './useImportColumns'

const DEFAULT_ARGS = {
  page: 1,
  pageSize: 100,
  sort: 'createdIn desc',
  where: '',
}

const tableContainerTheme = csx({ maxWidth: '100%', overflow: 'auto' })
const POLLING_INTERVAL = 3000

export default function History() {
  const { formatMessage } = useIntl()
  const [deleted /* , setDeleted */] = useState<string[]>([])
  const importModal = useModalState()
  const [importIdModal, setImportIdModal] = useState('')

  const columns = useImportColumns()

  const { data, loading, refetch } = useQueryCustom<Query, QueryImportsArgs>(
    IMPORTS_QUERY,
    {
      variables: { args: DEFAULT_ARGS },
      onCompleted({ imports: { data: imports } }) {
        if (
          imports.some(({ status }: Import) => statusBeforeFinished(status))
        ) {
          setTimeout(() => refetch(), POLLING_INTERVAL)
        }
      },
    }
  )

  const setDeleted = () => refetch()
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
      (!importModal.open && importToOpen.id === importIdModal)
    ) {
      url.searchParams.delete('id')
      window.parent.history.replaceState(null, '', url.toString())

      return
    }

    setImportIdModal(importToOpen.id)
    importModal.show()
  }, [importIdModal, importModal, imports])

  const items = useMemo(
    () => imports?.filter((item: Import) => !deleted?.includes(item.id)) ?? [],
    [deleted, imports]
  )

  const pageSize = items?.length

  const {
    data: tableData,
    getBodyCell,
    getHeadCell,
    getTable,
  } = useTableState<Import>({ columns, items })

  if (loading && !imports) {
    return <SuspenseFallback />
  }

  if (!pageSize) {
    return (
      <EmptyView
        text={formatMessage(messages.wizardAction)}
        onClick={goToWizardPage}
      />
    )
  }

  return (
    <Stack space="$space-4" fluid className={tableContainerTheme}>
      <Text variant="detail" className={csx({ paddingLeft: '$space-4' })}>
        {formatMessage(messages.importPaginationLabel, { pageSize })}
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
                importModal.show()
                setImportIdModal(item.id)
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
      {importModal.open && (
        <ShowImportModal
          modalState={importModal}
          id={importIdModal}
          setDeleted={setDeleted}
        />
      )}
    </Stack>
  )
}
