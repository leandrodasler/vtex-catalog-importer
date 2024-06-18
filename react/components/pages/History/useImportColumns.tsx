import type { TagProps } from '@vtex/admin-ui'
import {
  Flex,
  IconEye,
  IconTrash,
  Spinner,
  Tag,
  createColumns,
  csx,
} from '@vtex/admin-ui'
import React from 'react'
import { useMutation } from 'react-apollo'
import { useIntl } from 'react-intl'
import type {
  Import,
  Mutation,
  MutationDeleteImportsArgs,
} from 'ssesandbox04.catalog-importer'
import { useRuntime } from 'vtex.render-runtime'

import {
  Checked,
  Unchecked,
  messages,
  useStatusLabel,
  useStockOptionLabel,
} from '../../common'
import { DELETE_IMPORTS_MUTATION } from '../../graphql'

const mapStatusToVariant: Record<Import['status'], TagProps['variant']> = {
  PENDING: 'gray',
  RUNNING: 'lightBlue',
  SUCCESS: 'green',
  ERROR: 'red',
}

type Props = {
  setDeleted: React.Dispatch<React.SetStateAction<string[]>>
}

const useImportColumns = ({ setDeleted }: Props) => {
  const { formatMessage } = useIntl()
  const getStatusLabel = useStatusLabel()
  const getStockOptionLabel = useStockOptionLabel()
  const {
    culture: { locale },
  } = useRuntime()

  const [deleteImports, { loading }] = useMutation<
    Mutation,
    MutationDeleteImportsArgs
  >(DELETE_IMPORTS_MUTATION, {
    onCompleted(data) {
      setDeleted((prev) => [...prev, ...data.deleteImports])
    },
  })

  return createColumns<Import>([
    {
      id: 'createdIn',
      header: formatMessage(messages.importCreatedInLabel),
      resolver: {
        type: 'root',
        render: ({ item }) => new Date(item.createdIn).toLocaleString(locale),
      },
    },
    {
      id: 'settings',
      header: formatMessage(messages.settingsAccountLabel),
      resolver: {
        type: 'root',
        render: ({ item }) => {
          return item.settings.useDefault
            ? formatMessage(messages.settingsDefaultShort)
            : item.settings.account
        },
      },
    },
    {
      id: 'importImages',
      header: formatMessage(messages.optionsLabel),
      resolver: {
        type: 'root',
        render: ({ item }) => {
          const images = (
            <Flex>
              {item.importImages ? <Checked /> : <Unchecked />}
              {formatMessage(messages.importImagesLabel)}
            </Flex>
          )

          const prices = (
            <Flex>
              {item.importPrices ? <Checked /> : <Unchecked />}
              {formatMessage(messages.importPricesLabel)}
            </Flex>
          )

          return (
            <Flex
              className={csx({ gap: '$space-2' })}
              wrap={{ mobile: 'wrap' }}
            >
              {images}
              {prices}
            </Flex>
          )
        },
      },
    },
    {
      id: 'stocksOption',
      header: formatMessage(messages.importStocks),
      resolver: {
        type: 'root',
        render: ({ item }) => {
          return `${getStockOptionLabel(item.stocksOption)}${
            item.stockValue ? `: ${item.stockValue}` : ''
          }`
        },
      },
    },
    {
      id: 'status',
      header: formatMessage(messages.importStatusLabel),
      resolver: {
        type: 'root',
        render: ({ item }) => (
          <Tag
            label={getStatusLabel(item.status)}
            variant={mapStatusToVariant[item.status]}
          />
        ),
      },
    },
    {
      id: 'id',
      resolver: {
        type: 'menu',
        actions: [
          {
            label: formatMessage(messages.importViewLabel),
            icon: <IconEye />,
            onClick: (item, event) => {
              event.preventDefault()
              // eslint-disable-next-line no-alert
              alert(`Import: ${JSON.stringify(item, null, 2)}`)
            },
          },
          {
            label: formatMessage(messages.deleteLabel),
            critical: true,
            icon: loading ? <Spinner /> : <IconTrash />,
            onClick: (item, event) => {
              event.preventDefault()
              deleteImports({ variables: { ids: [item.id] } })
            },
          },
        ],
      },
    },
  ])
}

export default useImportColumns
