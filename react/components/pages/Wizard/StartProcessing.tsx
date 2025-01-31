import type { TabState } from '@vtex/admin-ui'
import {
  Button,
  Column,
  Columns,
  Flex,
  IconArrowLeft,
  IconArrowLineDown,
  IconEye,
  Modal,
  ModalContent,
  ModalDismiss,
  ModalHeader,
  ModalTitle,
  Stack,
  Text,
  csx,
  useModalState,
  useToast,
} from '@vtex/admin-ui'
import React, { useCallback, useMemo } from 'react'
import { useIntl } from 'react-intl'
import type {
  AppSettingsInput,
  Mutation,
  MutationExecuteImportArgs,
  StocksOption,
} from 'ssesandbox04.catalog-importer'

import type { CheckedCategories } from '.'
import { STOCK_OPTIONS } from '.'
import {
  FlexCenterResponsive,
  ModalButtons,
  Tree,
  categoryTreeMapper,
  messages,
  notLastColumnTheme,
  treeSorter,
  twoColumnsUnits,
  useStockOptionLabel,
} from '../../common'
import { EXECUTE_IMPORT_MUTATION, useMutationCustom } from '../../graphql'
import ShowImportModal from '../History/ShowImportModal'
import { ImportOption, buildTree, mapToCategoryInput } from './common'

interface StartProcessingProps {
  checkedTreeOptions: CheckedCategories
  importImages: boolean
  importPrices: boolean
  stocksOption: StocksOption
  stockValue?: number
  state: TabState
  settings: AppSettingsInput
  targetWarehouse: string
  setSuccessImport: React.Dispatch<React.SetStateAction<boolean>>
}

const toastKey = 'execute-import-message'

const StartProcessing: React.FC<StartProcessingProps> = ({
  checkedTreeOptions,
  stocksOption,
  importImages,
  importPrices,
  stockValue,
  state,
  settings,
  targetWarehouse,
  setSuccessImport,
}) => {
  const { formatMessage } = useIntl()
  const showToast = useToast()
  const confirmationImportModal = useModalState()
  const importModal = useModalState()
  const getStockOptionLabel = useStockOptionLabel()

  const { mutationFactory, loading, data: importData } = useMutationCustom<
    Mutation,
    MutationExecuteImportArgs
  >(EXECUTE_IMPORT_MUTATION, {
    toastKey,
    onCompleted(data) {
      if (!data.executeImport) {
        return
      }

      setSuccessImport(true)
      confirmationImportModal.hide()
      importModal.show()

      showToast({
        message: formatMessage(messages.startSuccess),
        duration: 5000,
        variant: 'positive',
        key: toastKey,
      })
    },
  })

  const treeData = useMemo(() => buildTree(checkedTreeOptions), [
    checkedTreeOptions,
  ])

  const categoryTree = useMemo(
    () => treeData.sort(treeSorter).map(categoryTreeMapper),
    [treeData]
  )

  const handleStartImport = useCallback(
    () =>
      mutationFactory({
        variables: {
          args: {
            categoryTree: mapToCategoryInput(treeData),
            settings,
            importImages,
            importPrices,
            stocksOption,
            targetWarehouse,
            ...(stocksOption === STOCK_OPTIONS.TO_BE_DEFINED && { stockValue }),
          },
        },
      })(),
    [
      importImages,
      importPrices,
      mutationFactory,
      settings,
      stockValue,
      stocksOption,
      targetWarehouse,
      treeData,
    ]
  )

  const gotToWizard = useCallback(() => {
    setSuccessImport(false)
    state.select('1')
  }, [setSuccessImport, state])

  return (
    <Stack space="$space-4" fluid>
      <Columns space={{ mobile: '$space-0', tablet: '$space-12' }}>
        <Column units={twoColumnsUnits} className={notLastColumnTheme}>
          <FlexCenterResponsive>
            <Flex direction="row" justify="left">
              {categoryTree.length && (
                <Tree
                  data={categoryTree}
                  title={formatMessage(messages.optionsCategories)}
                />
              )}
            </Flex>
          </FlexCenterResponsive>
        </Column>
        <Column units={twoColumnsUnits}>
          <FlexCenterResponsive>
            <Stack>
              <Text variant="title1">
                {formatMessage(messages.optionsLabel)}
              </Text>
              <div>
                {formatMessage(messages.settingsAccountLabel)}:{' '}
                <b>
                  {settings.useDefault
                    ? formatMessage(messages.settingsDefaultShort)
                    : settings.account}
                </b>
              </div>
              <ImportOption
                condition={importImages}
                label={formatMessage(messages.importImage)}
              />
              <ImportOption
                condition={importPrices}
                label={formatMessage(messages.importPrice)}
              />
              <div>
                {formatMessage(messages.importStocks)}:{' '}
                <b>{getStockOptionLabel(stocksOption).toLowerCase()}</b>
              </div>
              {stocksOption === STOCK_OPTIONS.TO_BE_DEFINED && (
                <div>
                  {formatMessage(messages.stockValue)}: <b>{stockValue}</b>
                </div>
              )}
              <div>
                {formatMessage(messages.targetWarehouse)}:{' '}
                <b>{targetWarehouse}</b>
              </div>
            </Stack>
          </FlexCenterResponsive>
        </Column>
      </Columns>
      <Flex
        justify="space-between"
        className={csx({ marginTop: '$space-4', gap: '$space-3' })}
        direction={{ mobile: 'column', tablet: 'row' }}
      >
        <Button
          variant="secondary"
          onClick={
            importData?.executeImport ? gotToWizard : () => state.select('3')
          }
          icon={<IconArrowLeft />}
          disabled={loading || confirmationImportModal.open || importModal.open}
        >
          {importData?.executeImport
            ? formatMessage(messages.wizardAction)
            : formatMessage(messages.previousLabel)}
        </Button>
        <Button
          icon={importData?.executeImport ? <IconEye /> : <IconArrowLineDown />}
          disabled={loading || confirmationImportModal.open || importModal.open}
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
          <ModalContent>
            {formatMessage(messages.startText)}
            <ModalButtons>
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
            </ModalButtons>
          </ModalContent>
        </Modal>
      )}

      {importModal.open && importData?.executeImport && (
        <ShowImportModal
          modalState={importModal}
          id={importData.executeImport}
          setDeleted={() => {}}
        />
      )}
    </Stack>
  )
}

export default StartProcessing
