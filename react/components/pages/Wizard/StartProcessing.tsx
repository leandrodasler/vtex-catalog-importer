import type { TabState } from '@vtex/admin-ui'
import {
  Button,
  Flex,
  IconArrowLeft,
  IconArrowLineDown,
  csx,
  useToast,
} from '@vtex/admin-ui'
import React from 'react'
import { useMutation } from 'react-apollo'
import { useIntl } from 'react-intl'
import type {
  AppSettingsInput,
  Category,
  Mutation,
  MutationExecuteImportArgs,
  StocksOption,
} from 'ssesandbox04.catalog-importer'

import { IMPORT_OPTIONS, STOCK_OPTIONS } from '.'
import { messages } from '../../common'
import {
  EXECUTE_IMPORT_MUTATION,
  getGraphQLMessageDescriptor,
} from '../../graphql'

interface StartProcessingProps {
  checkedTreeOptions: { [key: string]: Category & { checked: boolean } }
  optionsChecked: {
    checkedItems: number[]
    value: string
    stockOption: StocksOption
  }
  state: TabState
  settings: AppSettingsInput
}

const StartProcessing = ({
  checkedTreeOptions,
  optionsChecked,
  state,
  settings,
}: StartProcessingProps) => {
  const { formatMessage } = useIntl()
  const showToast = useToast()

  const [executeImport, { loading }] = useMutation<
    Mutation,
    MutationExecuteImportArgs
  >(EXECUTE_IMPORT_MUTATION, {
    notifyOnNetworkStatusChange: true,
    onError(error) {
      showToast({
        message: formatMessage(getGraphQLMessageDescriptor(error)),
        variant: 'critical',
        key: 'execute-import-message',
      })
    },
    onCompleted(data) {
      if (data.executeImport) {
        showToast({
          message:
            'Import started successfully. Full logs will be available in the Importer History page.',
          variant: 'positive',
          key: 'execute-import-message',
        })
      }
    },
  })

  const convertChildrenToObject = (
    children: Category[]
  ): { [key: string]: Category & { checked: boolean } } => {
    return children.reduce((acc, child) => {
      acc[child.id] = { ...child, checked: true }

      return acc
    }, {} as { [key: string]: Category & { checked: boolean } })
  }

  const renderTree = (
    tree: { [key: string]: Category & { checked: boolean } },
    level = 0
  ) => {
    return (
      <ul style={{ paddingLeft: level * 20 }}>
        {Object.entries(tree).map(([key, value]) => (
          <li key={key}>
            <span>{value.name}</span>
            {value.children &&
              value.children.length > 0 &&
              renderTree(convertChildrenToObject(value.children), level + 1)}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <Flex style={{ flexDirection: 'column' }}>
      <h3>{formatMessage(messages.optionsCategories)}</h3>
      {renderTree(checkedTreeOptions)}
      <h3>{formatMessage(messages.optionsLabel)}</h3>
      <div>
        {formatMessage(messages.importImage)}:{' '}
        {optionsChecked.checkedItems.includes(IMPORT_OPTIONS.IMPORT_IMAGE)
          ? formatMessage(messages.yesLabel)
          : formatMessage(messages.noLabel)}
      </div>
      <div>
        {formatMessage(messages.importPrice)}:{' '}
        {optionsChecked.checkedItems.includes(IMPORT_OPTIONS.IMPORT_PRICE)
          ? formatMessage(messages.yesLabel)
          : formatMessage(messages.noLabel)}
      </div>
      <div>
        {formatMessage(messages.importStocks)}:{' '}
        {optionsChecked.stockOption === STOCK_OPTIONS.KEEP_SOURCE ? (
          formatMessage(messages.optionsSource)
        ) : optionsChecked.stockOption === STOCK_OPTIONS.UNLIMITED ? (
          formatMessage(messages.optionsUnlimited)
        ) : (
          <>
            {formatMessage(messages.optionsDefined)}: {optionsChecked.value}
          </>
        )}
      </div>
      <Flex justify="space-between" className={csx({ marginTop: '$space-4' })}>
        <Button
          onClick={() => state.select(state.previous())}
          icon={<IconArrowLeft />}
          disabled={loading}
        >
          {formatMessage(messages.previousLabel)}
        </Button>
        <Button
          icon={<IconArrowLineDown />}
          disabled={loading}
          loading={loading}
          onClick={() => {
            executeImport({
              variables: {
                args: {
                  categoryTree: Object.entries(checkedTreeOptions).map((c) => ({
                    id: c[0],
                    name: c[1].name,
                  })),
                  settings,
                  importImages: optionsChecked.checkedItems.includes(
                    IMPORT_OPTIONS.IMPORT_IMAGE
                  ),
                  importPrices: optionsChecked.checkedItems.includes(
                    IMPORT_OPTIONS.IMPORT_PRICE
                  ),
                  stocksOption: optionsChecked.stockOption,
                  ...(optionsChecked.stockOption ===
                    STOCK_OPTIONS.TO_BE_DEFINED &&
                    optionsChecked.value && {
                      stockValue: +optionsChecked.value,
                    }),
                },
              },
            })
          }}
        >
          {formatMessage(messages.startLabel)}
        </Button>
      </Flex>
    </Flex>
  )
}

export default StartProcessing
