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
  csx,
  useModalState,
  useToast,
} from '@vtex/admin-ui'
import React, { useCallback, useMemo } from 'react'
import { useMutation } from 'react-apollo'
import { useIntl } from 'react-intl'
import type {
  AppSettingsInput,
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
  checkedTreeOptions: { [key: string]: { checked: boolean; name: string } }
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
  const checkedCategories = useMemo(
    () =>
      Object.values(checkedTreeOptions)
        .filter((option) => option.checked)
        .map((option) => option.name),
    [checkedTreeOptions]
  )

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

  const handleStartImport = useCallback(
    () =>
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
            ...(optionsChecked.stockOption === STOCK_OPTIONS.TO_BE_DEFINED &&
              optionsChecked.value && {
                stockValue: +optionsChecked.value,
              }),
          },
        },
      }),
    [
      checkedTreeOptions,
      executeImport,
      optionsChecked.checkedItems,
      optionsChecked.stockOption,
      optionsChecked.value,
      settings,
    ]
  )

  return (
    <Flex style={{ flexDirection: 'column' }}>
      <h3>{formatMessage(messages.optionsCategories)}</h3>
      {checkedCategories.map((categoryName, index) => (
        <div key={index}>{categoryName}</div>
      ))}
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
    </Flex>
  )
}

export default StartProcessing
