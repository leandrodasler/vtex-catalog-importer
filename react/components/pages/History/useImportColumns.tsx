import type { TagProps } from '@vtex/admin-ui'
import { Flex, Tag, createColumns, csx } from '@vtex/admin-ui'
import React from 'react'
import { useIntl } from 'react-intl'
import type { Import, ImportStatus } from 'ssesandbox04.catalog-importer'

import {
  Checked,
  Unchecked,
  messages,
  useStatusLabel,
  useStockOptionLabel,
} from '../../common'
import { useLocaleDate } from './common'

export const mapStatusToVariant: Record<ImportStatus, TagProps['variant']> = {
  PENDING: 'gray',
  RUNNING: 'lightBlue',
  SUCCESS: 'green',
  ERROR: 'red',
  TO_BE_DELETED: 'red',
  DELETING: 'red',
}

const useImportColumns = () => {
  const { formatMessage } = useIntl()
  const getStatusLabel = useStatusLabel()
  const { getStartedAt, getFinishedAt } = useLocaleDate()
  const getStockOptionLabel = useStockOptionLabel()

  return createColumns<Import>([
    {
      id: 'createdIn',
      header: formatMessage(messages.importCreatedInLabel),
      resolver: {
        type: 'root',
        render: ({ item: { createdIn } }) => getStartedAt(createdIn),
      },
    },
    {
      id: 'lastInteractionIn',
      header: formatMessage(messages.importLastInteractionInLabel),
      resolver: {
        type: 'root',
        render: ({ item: { lastInteractionIn, status } }) =>
          getFinishedAt(lastInteractionIn, status),
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
  ])
}

export default useImportColumns
