import type { TagProps, useModalState } from '@vtex/admin-ui'
import {
  Flex,
  IconEye,
  IconTrash,
  Tag,
  createColumns,
  csx,
} from '@vtex/admin-ui'
import React from 'react'
import { useIntl } from 'react-intl'
import type { Import } from 'ssesandbox04.catalog-importer'
import { useRuntime } from 'vtex.render-runtime'

import {
  Checked,
  Unchecked,
  messages,
  useStatusLabel,
  useStockOptionLabel,
} from '../../common'

export const mapStatusToVariant: Record<
  Import['status'],
  TagProps['variant']
> = {
  PENDING: 'gray',
  RUNNING: 'lightBlue',
  SUCCESS: 'green',
  ERROR: 'red',
}

type Props = {
  setDeleted: React.Dispatch<React.SetStateAction<string[]>>
  openInfosImportmodal: ReturnType<typeof useModalState>
  setImportIdModal: React.Dispatch<React.SetStateAction<string>>
  openDeleteConfirmationModal: ReturnType<typeof useModalState>
  setDeleteId: React.Dispatch<React.SetStateAction<string>>
}

const useImportColumns = ({
  openInfosImportmodal,
  setImportIdModal,
  openDeleteConfirmationModal,
  setDeleteId,
}: Props) => {
  const { formatMessage } = useIntl()
  const getStatusLabel = useStatusLabel()
  const getStockOptionLabel = useStockOptionLabel()
  const {
    culture: { locale },
  } = useRuntime()

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
            item.stocksOption === 'TO_BE_DEFINED' ? `: ${item.stockValue}` : ''
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
            onClick: (item) => {
              const url = new URL(window.parent.location.href)

              url.searchParams.set('id', item.id)
              window.parent.history.replaceState(null, '', url.toString())
              openInfosImportmodal.show()
              setImportIdModal(item.id)
            },
          },
          {
            label: formatMessage(messages.deleteLabel),
            critical: true,
            icon: <IconTrash />,
            onClick: (item) => {
              openDeleteConfirmationModal.show()
              setDeleteId(item.id)
            },
          },
        ],
      },
    },
  ])
}

export default useImportColumns
