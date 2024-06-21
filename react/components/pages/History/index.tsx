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
              onClick={() =>
                // eslint-disable-next-line no-alert
                alert(`Import: ${JSON.stringify(item, null, 2)}`)
              }
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
    </Stack>
  )
}
