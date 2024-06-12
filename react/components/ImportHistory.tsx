import {
  DataView,
  IconEye,
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
      actions: 'Actions',
    }
  })

const columns = createColumns([
  {
    id: 'name',
    header: 'Name',
    width: '2fr',
    resolver: {
      type: 'text',
      columnType: 'name',
      mapText: (item) => item.name,
      render: ({ data }) => (
        <div className={csx({ minWidth: '10rem' })}>{data}</div>
      ),
    },
  },
  {
    id: 'brand',
    header: 'Brand',
    width: '1fr',
    resolver: {
      type: 'root',
      render: ({ item }) => {
        return <div className={csx({ minWidth: '6rem' })}>{item.brand}</div>
      },
    },
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
    id: 'actions',
    resolver: {
      type: 'menu',
      actions: [
        {
          label: 'View details',
          icon: <IconEye />,
          // eslint-disable-next-line no-alert
          onClick: (item) => alert(`Item: ${item.name}`),
        },
      ],
    },
  },
])

export default function WithPagination() {
  const view = useDataViewState()
  const pagination = usePaginationState({
    pageSize: ITEMS_PER_PAGE,
    total: NUMBER_OF_ITEMS,
  })

  const { data, getBodyCell, getHeadCell, getTable } = useTableState({
    status: view.status,
    columns,
    items: items.slice(pagination.range[0] - 1, pagination.range[1]),
    length: ITEMS_PER_PAGE,
  })

  return (
    <DataView state={view}>
      <Pagination state={pagination} />
      <Table {...getTable()} width="100%">
        <THead>
          {columns.map((column, index) => (
            <THeadCell {...getHeadCell(column)} key={`header-${index}`} />
          ))}
        </THead>
        <TBody>
          {data.map((item, index) => {
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
