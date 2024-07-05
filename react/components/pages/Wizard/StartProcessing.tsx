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
import React, { useCallback, useMemo } from 'react'
import { flattenTree } from 'react-accessible-treeview'
import { useMutation } from 'react-apollo'
import { useIntl } from 'react-intl'
import type {
  AppSettingsInput,
  Mutation,
  MutationExecuteImportArgs,
  StocksOption,
} from 'ssesandbox04.catalog-importer'

import type { CheckedCategories } from '.'
import { IMPORT_OPTIONS, STOCK_OPTIONS } from '.'
import {
  Tree,
  categoryTreeMapper,
  goToHistoryPage,
  messages,
  useStockOptionLabel,
} from '../../common'
import {
  EXECUTE_IMPORT_MUTATION,
  getGraphQLMessageDescriptor,
} from '../../graphql'
import { ImportOption, buildTree, mapToCategoryInput } from './common'

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
          seconds: NAVIGATE_DELAY / 1000,
        }),
        action: {
          label: formatMessage(messages.historyAction),
          onClick: () => goToHistoryPage(data.executeImport),
        },
        duration: NAVIGATE_DELAY,
        variant: 'positive',
        key: 'execute-import-message',
      })

      setTimeout(() => goToHistoryPage(data.executeImport), NAVIGATE_DELAY)
    },
  })

  const disabledButtons = loading || !!importData?.executeImport

  const treeData = useMemo(() => buildTree(checkedTreeOptions), [
    checkedTreeOptions,
  ])

  const handleStartImport = useCallback(
    () =>
      executeImport({
        variables: {
          args: {
            categoryTree: mapToCategoryInput(treeData),
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
      executeImport,
      optionsChecked.checkedItems,
      optionsChecked.stockOption,
      optionsChecked.value,
      settings,
      treeData,
    ]
  )

  const categoryTreeFolder = useMemo(
    () =>
      flattenTree({
        name: '',
        children: [
          {
            name: formatMessage(messages.optionsCategories),
            children: treeData.map(categoryTreeMapper) ?? [],
          },
        ],
      }),
    [treeData, formatMessage]
  )

  return (
    <Stack space="$space-4" fluid>
      <Flex
        direction={{ mobile: 'column', tablet: 'row' }}
        align={{ mobile: 'center', tablet: 'start' }}
        justify="space-evenly"
        className={csx({ gap: '$space-4' })}
      >
        <Flex justify="flex-start" direction="column">
          <h3>{formatMessage(messages.optionsCategories)}</h3>
          <Flex direction="row">
            {categoryTreeFolder.length && <Tree data={categoryTreeFolder} />}
          </Flex>
        </Flex>
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
          <ImportOption
            condition={optionsChecked.checkedItems.includes(
              IMPORT_OPTIONS.IMPORT_IMAGE
            )}
            label={formatMessage(messages.importImage)}
          />
          <ImportOption
            condition={optionsChecked.checkedItems.includes(
              IMPORT_OPTIONS.IMPORT_PRICE
            )}
            label={formatMessage(messages.importPrice)}
          />
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
          onClick={() => state.select('3')}
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
