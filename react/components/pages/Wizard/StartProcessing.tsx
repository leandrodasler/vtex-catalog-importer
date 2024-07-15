import type { TabState } from '@vtex/admin-ui'
import {
  Button,
  Flex,
  IconArrowLeft,
  IconArrowLineDown,
  IconEye,
  Modal,
  ModalContent,
  ModalDismiss,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  Stack,
  Text,
  csx,
  useModalState,
  useToast,
} from '@vtex/admin-ui'
import React, { Suspense, lazy, useCallback, useMemo } from 'react'
import { useMutation } from 'react-apollo'
import { useIntl } from 'react-intl'
import type {
  AppSettingsInput,
  Mutation,
  MutationExecuteImportArgs,
} from 'ssesandbox04.catalog-importer'

import type { CheckedCategories, Options } from '.'
import { IMPORT_OPTIONS, STOCK_OPTIONS } from '.'
import {
  Tree,
  categoryTreeMapper,
  messages,
  treeSorter,
  useStockOptionLabel,
} from '../../common'
import {
  EXECUTE_IMPORT_MUTATION,
  getGraphQLMessageDescriptor,
} from '../../graphql'
import { ImportOption, buildTree, mapToCategoryInput } from './common'

const ShowImportModal = lazy(() => import('../History/ShowImportModal'))

interface StartProcessingProps {
  checkedTreeOptions: CheckedCategories
  optionsChecked: Options
  state: TabState
  settings: AppSettingsInput
  setSuccessImport: React.Dispatch<React.SetStateAction<boolean>>
}

const StartProcessing: React.FC<StartProcessingProps> = ({
  checkedTreeOptions,
  optionsChecked,
  state,
  settings,
  setSuccessImport,
}) => {
  const { formatMessage } = useIntl()
  const showToast = useToast()
  const confirmationImportModal = useModalState()
  const importModal = useModalState()
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

      setSuccessImport(true)
      confirmationImportModal.hide()
      importModal.show()

      showToast({
        message: formatMessage(messages.startSuccess),
        variant: 'positive',
        key: 'execute-import-message',
      })
    },
  })

  const disabledButtons = loading || !!importData?.executeImport

  const treeData = useMemo(() => buildTree(checkedTreeOptions), [
    checkedTreeOptions,
  ])

  const categoryTree = useMemo(
    () => treeData.sort(treeSorter).map(categoryTreeMapper),
    [treeData]
  )

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
            ...(optionsChecked.stockOption === STOCK_OPTIONS.TO_BE_DEFINED && {
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

  return (
    <Stack space="$space-4" fluid>
      <Flex
        direction={{ mobile: 'column', tablet: 'row' }}
        align={{ mobile: 'center', tablet: 'start' }}
        justify="space-evenly"
        className={csx({ gap: '$space-4' })}
      >
        <Flex justify="flex-start" direction="column">
          <Flex direction="row">
            {categoryTree.length && (
              <Tree
                data={categoryTree}
                title={formatMessage(messages.optionsCategories)}
              />
            )}
          </Flex>
        </Flex>
        <div>
          <Text variant="title1">{formatMessage(messages.optionsLabel)}</Text>
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
          icon={importData?.executeImport ? <IconEye /> : <IconArrowLineDown />}
          disabled={loading || importModal.open}
          loading={loading}
          onClick={
            importData?.executeImport
              ? () => importModal.show()
              : () => confirmationImportModal.show()
          }
        >
          {importData?.executeImport
            ? formatMessage(messages.importViewLabel)
            : formatMessage(messages.startLabel)}
        </Button>
      </Flex>
      {confirmationImportModal.open && (
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
      )}
      <Suspense fallback={null}>
        {importModal.open && importData?.executeImport && (
          <ShowImportModal
            modalState={importModal}
            id={importData.executeImport}
          />
        )}
      </Suspense>
    </Stack>
  )
}

export default StartProcessing
