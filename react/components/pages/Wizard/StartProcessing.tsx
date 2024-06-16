import type { TabState } from '@vtex/admin-ui'
import {
  Button,
  Flex,
  IconArrowLeft,
  IconArrowLineDown,
  IconCheckCircle,
  IconXCircle,
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
import { messages } from '../../common'
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

const StartProcessing: React.FC<StartProcessingProps> = ({
  checkedTreeOptions,
  optionsChecked,
  state,
  settings,
}) => {
  const { formatMessage } = useIntl()
  const showToast = useToast()
  const confirmationImportModal = useModalState()

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
        confirmationImportModal.hide()
        showToast({
          message: formatMessage(messages.startSuccess),
          variant: 'positive',
          key: 'execute-import-message',
        })
      }
    },
  })

  const convertChildrenToObject = (children: Category[]) => {
    return children.reduce(
      (acc, child) => ({ ...acc, [child.id]: { ...child, checked: true } }),
      {} as CheckedCategories
    )
  }

  const renderTree = (tree: CheckedCategories, level = 0) => (
    <ul style={{ paddingLeft: '1rem' }}>
      {Object.entries(tree).map(([key, value]) => (
        <li key={key} style={{ marginLeft: '1rem' }}>
          <span>{value.name}</span>
          {value.children &&
            value.children.length > 0 &&
            renderTree(convertChildrenToObject(value.children), level + 1)}
        </li>
      ))}
    </ul>
  )

  const renderOption = (label: string, condition: boolean) => (
    <Stack direction="row" space="$space-1">
      <span>{label}:</span>
      {condition ? (
        <IconCheckCircle
          title={formatMessage(messages.yesLabel)}
          weight="fill"
          className={csx({ color: '$positive' })}
        />
      ) : (
        <IconXCircle
          title={formatMessage(messages.noLabel)}
          weight="fill"
          className={csx({ color: '$critical' })}
        />
      )}
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
          {renderTree(checkedTreeOptions)}
        </div>
        <div>
          <h3>{formatMessage(messages.optionsLabel)}</h3>
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
            {optionsChecked.stockOption === STOCK_OPTIONS.KEEP_SOURCE
              ? formatMessage(messages.optionsSource)
              : optionsChecked.stockOption === STOCK_OPTIONS.UNLIMITED
              ? formatMessage(messages.optionsUnlimited)
              : `${formatMessage(messages.optionsDefined)}: ${
                  optionsChecked.value
                }`}
          </div>
        </div>
      </Flex>
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
            disabled={loading}
            variant="secondary"
            onClick={() => confirmationImportModal.hide()}
          >
            {formatMessage(messages.cancelLabel)}
          </Button>
          <Button
            icon={<IconArrowLineDown />}
            disabled={loading}
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
