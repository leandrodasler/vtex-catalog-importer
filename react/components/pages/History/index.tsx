import {
  Button,
  Center,
  DataView,
  Stack,
  TBody,
  TBodyCell,
  TBodyRow,
  THead,
  THeadCell,
  Table,
  Text,
  csx,
  useDataViewState,
  useTableState,
} from '@vtex/admin-ui'
import React, { useState } from 'react'
import { useIntl } from 'react-intl'
import type {
  Import,
  Query,
  QueryImportsArgs,
} from 'ssesandbox04.catalog-importer'

import { SuspenseFallback, goToWizardPage, messages } from '../../common'
import { IMPORTS_QUERY, useQueryCustom } from '../../graphql'
import useImportColumns from './useImportColumns'

const ITEMS_PER_PAGE = 5

export default function History() {
  const { formatMessage } = useIntl()
  const [deleted, setDeleted] = useState<string[]>([])

  const { data, loading } = useQueryCustom<Query, QueryImportsArgs>(
    IMPORTS_QUERY,
    {
      variables: {
        args: {
          page: 1,
          pageSize: ITEMS_PER_PAGE,
          sort: 'createdIn desc',
          where: '',
        },
      },
    }
  )

  const columns = useImportColumns({ setDeleted })
  const total = (data?.imports.pagination.total ?? 0) - deleted.length
  const items = data?.imports.data.filter(
    (item: Import) => !deleted?.includes(item.id)
  )

  const pageSize = items?.length ?? 0

  const {
    data: tableData,
    getBodyCell,
    getHeadCell,
    getTable,
  } = useTableState<Import>({ columns, items })

  const emptyView = useDataViewState({
    notFound: false,
    loading: false,
    empty: {
      action: {
        text: formatMessage(messages.wizardAction),
        onClick: goToWizardPage,
      },
    },
    error: null,
  })

  if (loading) {
    return <SuspenseFallback />
  }

  if (!pageSize) {
    return <DataView state={emptyView} />
  }

  return (
    <Stack space="$space-4" fluid>
      <Text variant="detail" className={csx({ paddingLeft: '$space-4' })}>
        {formatMessage(messages.paginationLabel, { current: pageSize, total })}
      </Text>
      <Table {...getTable()}>
        <THead>
          {columns.map((column, index) => (
            <THeadCell {...getHeadCell(column)} key={`header-${index}`} />
          ))}
        </THead>
        <TBody>
          {tableData.map((item, index) => {
            return (
              <TBodyRow
                key={`row-${index}`}
                onClick={() =>
                  // eslint-disable-next-line no-alert
                  alert(`Import: ${JSON.stringify(item, null, 2)}`)
                }
              >
                {columns.map((column, indexColumn) => {
                  return (
                    <TBodyCell
                      {...getBodyCell(column, item)}
                      key={`column-${indexColumn}`}
                    />
                  )
                })}
              </TBodyRow>
            )
          })}
        </TBody>
      </Table>
      {total > pageSize && (
        <Center>
          <Button variant="secondary">
            {formatMessage(messages.loadLabel)}
          </Button>
        </Center>
      )}
    </Stack>
  )
}
