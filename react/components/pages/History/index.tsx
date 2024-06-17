import {
  DataView,
  IconEye,
  IconTrash,
  Pagination,
  TBody,
  TBodyCell,
  TBodyRow,
  THead,
  THeadCell,
  Table,
  Tag,
  createColumns,
  csx,
  useDataViewState,
  usePaginationState,
  useTableState,
} from '@vtex/admin-ui'
import faker from 'faker'
import React from 'react'
import type { Query, QueryImportsArgs } from 'ssesandbox04.catalog-importer'

import { SuspenseFallback } from '../../common'
import { IMPORTS_QUERY, useQueryCustom } from '../../graphql'

const NUMBER_OF_ITEMS = 100
const ITEMS_PER_PAGE = 25

const items = Array(NUMBER_OF_ITEMS)
  .fill({}, 0, NUMBER_OF_ITEMS)
  .map((_, id) => {
    return {
      id: `${id}`,
      name: faker.commerce.productName(),
      brand: faker.random.arrayElement([
        'Revolution',
        'Desire Spirit',
        'Pathway',
        'AeroSmart',
        'Quality Prints',
        'Traction Race',
      ]),
      price: faker.commerce.price(),
      status: 'Inactive',
    }
  })

const columns = createColumns([
  {
    id: 'name',
    header: 'Name',
    width: '2fr',
  },
  {
    id: 'brand',
    header: 'Brand',
    width: '1fr',
  },
  {
    id: 'price',
    header: 'Price',
    width: '1fr',
    resolver: {
      type: 'currency',
      locale: 'en-US',
      currency: 'USD',
    },
  },
  {
    id: 'status',
    header: 'Status',
    width: '1fr',
    resolver: {
      type: 'root',
      render: ({ item }) => {
        return <Tag label={item.status} size="normal" />
      },
    },
  },
  {
    id: 'id',
    resolver: {
      type: 'menu',
      actions: [
        {
          label: 'View details',
          icon: <IconEye />,
          // eslint-disable-next-line no-alert
          onClick: (item) => alert(`Item: ${item.name}`),
        },
        {
          label: 'Delete',
          critical: true,
          icon: <IconTrash />,
          // eslint-disable-next-line no-alert
          onClick: (item) => alert(`Delete item: ${item.name}?`),
        },
      ],
    },
  },
])

export default function History() {
  const { data, loading } = useQueryCustom<Query, QueryImportsArgs>(
    IMPORTS_QUERY,
    {
      variables: {
        args: {
          page: 1,
          pageSize: 5,
          sort: 'createdIn desc',
          where: '',
        },
      },
    }
  )

  const view = useDataViewState()
  const pagination = usePaginationState({
    pageSize: ITEMS_PER_PAGE,
    total: NUMBER_OF_ITEMS,
  })

  const { data: tableData, getBodyCell, getHeadCell, getTable } = useTableState(
    {
      status: view.status,
      columns,
      items: items.slice(pagination.range[0] - 1, pagination.range[1]),
      length: ITEMS_PER_PAGE,
    }
  )

  return (
    <DataView state={view}>
      {loading && <SuspenseFallback />}
      {data?.imports && (
        <textarea className={csx({ width: '100%', height: 500 })}>
          {JSON.stringify(data.imports, null, 2)}
        </textarea>
      )}

      <Pagination state={pagination} />
      <Table {...getTable()} width="100%">
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
                // eslint-disable-next-line no-alert
                onClick={() => alert(`Item: ${item.name}`)}
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
      <Pagination state={pagination} />
    </DataView>
  )
}
