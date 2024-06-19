import type { TabState } from '@vtex/admin-ui'
import {
  Button,
  Flex,
  IconArrowLeft,
  IconArrowLineDown,
  Modal,
  ModalContent,
  ModalDismiss,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  Stack,
  csx,
  useModalState,
  useToast,
} from '@vtex/admin-ui'
import React, { useCallback } from 'react'
import { useMutation } from 'react-apollo'
import { useIntl } from 'react-intl'
import type {
  AppSettingsInput,
  Category,
  CategoryInput,
  Mutation,
  MutationExecuteImportArgs,
  StocksOption,
} from 'ssesandbox04.catalog-importer'

import type { CheckedCategories } from '.'
import { IMPORT_OPTIONS, STOCK_OPTIONS } from '.'
import {
  Checked,
  Countdown,
  Unchecked,
  goToHistoryPage,
  messages,
  useStockOptionLabel,
} from '../../common'
import {
  EXECUTE_IMPORT_MUTATION,
  getGraphQLMessageDescriptor,
} from '../../graphql'

interface StartProcessingProps {
  checkedTreeOptions: CheckedCategories
  optionsChecked: {
    checkedItems: number[]
    value: string
    stockOption: StocksOption
  }
  state: TabState
  settings: AppSettingsInput
}

const NAVIGATE_DELAY = 10000

const StartProcessing: React.FC<StartProcessingProps> = ({
  checkedTreeOptions,
  optionsChecked,
  state,
  settings,
}) => {
  const { formatMessage } = useIntl()
  const showToast = useToast()
  const confirmationImportModal = useModalState()
  const getStockOptionLabel = useStockOptionLabel()

  const [executeImport, { loading, data: importData }] = useMutation<
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
      if (!data.executeImport) {
        return
      }

      confirmationImportModal.hide()

      showToast({
        message: formatMessage(messages.startSuccess, {
          seconds: (
            <Countdown key="countdown" seconds={NAVIGATE_DELAY / 1000} />
          ),
        }),
        action: {
          label: formatMessage(messages.historyAction),
          onClick: goToHistoryPage,
        },
        duration: NAVIGATE_DELAY,
        variant: 'positive',
        key: 'execute-import-message',
      })

      setTimeout(goToHistoryPage, NAVIGATE_DELAY)
    },
  })

  const disabledButtons = loading || !!importData?.executeImport

  const renderOption = (label: string, condition: boolean) => (
    <Stack direction="row" space="$space-1">
      <span>{label}</span>
      {condition ? <Checked /> : <Unchecked />}
    </Stack>
  )

  const convertEntry: (
    entry: [string, Category]
  ) => CategoryInput = useCallback(
    (entry: [string, Category]) => ({
      id: entry[0],
      name: entry[1].name,
      ...(!!entry[1]?.children?.length && {
        children: Object.entries(entry[1].children).map(convertEntry),
      }),
    }),
    []
  )

  const handleStartImport = useCallback(
    () =>
      executeImport({
        variables: {
          args: {
            categoryTree: Object.entries(checkedTreeOptions).map(convertEntry),
            settings,
            importImages: optionsChecked.checkedItems.includes(
              IMPORT_OPTIONS.IMPORT_IMAGE
            ),
            importPrices: optionsChecked.checkedItems.includes(
              IMPORT_OPTIONS.IMPORT_PRICE
            ),
            stocksOption: optionsChecked.stockOption,
            ...(optionsChecked.stockOption === STOCK_OPTIONS.TO_BE_DEFINED &&
              optionsChecked.value && {
                stockValue: +optionsChecked.value,
              }),
          },
        },
      }),
    [
      checkedTreeOptions,
      convertEntry,
      executeImport,
      optionsChecked.checkedItems,
      optionsChecked.stockOption,
      optionsChecked.value,
      settings,
    ]
  )

  const buildTree = (categories: CheckedCategories) => {
    const tree: { [key: string]: Category & { children: Category[] } } = {}

    Object.values(categories).forEach((category) => {
      tree[category.id] = { ...category, children: [] }
    })

    Object.values(tree).forEach((category) => {
      if (category.parentId && tree[category.parentId]) {
        tree[category.parentId].children.push(category)
      }
    })

    return Object.values(tree).filter((category) => !category.parentId)
  }

  const renderTree = (categories: Category[], level = 0) => {
    return categories.map((category) => (
      <div key={category.id} style={{ marginLeft: level * 20 }}>
        {category.checked && <div>{category.name}</div>}
        {category.children &&
          category.children.length > 0 &&
          renderTree(category.children, level + 1)}
      </div>
    ))
  }

  const treeData = buildTree(checkedTreeOptions)

  return (
    <Stack space="$space-4" fluid>
      <Flex
        direction={{ mobile: 'column', tablet: 'row' }}
        align={{ mobile: 'center', tablet: 'start' }}
        justify="space-evenly"
        className={csx({ gap: '$space-4' })}
      >
        <div>
          <h3>{formatMessage(messages.optionsCategories)}</h3>
          <ul>{renderTree(treeData)}</ul>
        </div>
        <div>
          <h3>{formatMessage(messages.optionsLabel)}</h3>
          <div>
            {formatMessage(messages.settingsAccountLabel)}:{' '}
            <b>
              {settings.useDefault
                ? formatMessage(messages.settingsDefaultShort)
                : settings.account}
            </b>
          </div>
          {renderOption(
            formatMessage(messages.importImage),
            optionsChecked.checkedItems.includes(IMPORT_OPTIONS.IMPORT_IMAGE)
          )}
          {renderOption(
            formatMessage(messages.importPrice),
            optionsChecked.checkedItems.includes(IMPORT_OPTIONS.IMPORT_PRICE)
          )}
          <div>
            {formatMessage(messages.importStocks)}:{' '}
            <b>
              {getStockOptionLabel(optionsChecked.stockOption).toLowerCase()}
            </b>
          </div>
          {optionsChecked.stockOption === STOCK_OPTIONS.TO_BE_DEFINED && (
            <div>
              {formatMessage(messages.stockValue)}:{' '}
              <b>{optionsChecked.value}</b>
            </div>
          )}
        </div>
      </Flex>
      <Flex justify="space-between" className={csx({ marginTop: '$space-4' })}>
        <Button
          onClick={() => state.select(state.previous())}
          icon={<IconArrowLeft />}
          disabled={disabledButtons}
        >
          {formatMessage(messages.previousLabel)}
        </Button>
        <Button
          icon={<IconArrowLineDown />}
          disabled={disabledButtons}
          loading={loading}
          onClick={() => confirmationImportModal.show()}
        >
          {formatMessage(messages.startLabel)}
        </Button>
      </Flex>
      <Modal state={confirmationImportModal}>
        <ModalHeader>
          <ModalTitle>{formatMessage(messages.startConfirmation)}</ModalTitle>
          <ModalDismiss />
        </ModalHeader>
        <ModalContent>{formatMessage(messages.startText)}</ModalContent>
        <ModalFooter>
          <Button
            disabled={disabledButtons}
            variant="secondary"
            onClick={() => confirmationImportModal.hide()}
          >
            {formatMessage(messages.cancelLabel)}
          </Button>
          <Button
            icon={<IconArrowLineDown />}
            disabled={disabledButtons}
            loading={confirmationImportModal.open && loading}
            onClick={handleStartImport}
          >
            {formatMessage(messages.startLabel)}
          </Button>
        </ModalFooter>
      </Modal>
    </Stack>
  )
}

export default StartProcessing
