import {
  Button,
  Column,
  Columns,
  IconTrash,
  Modal,
  ModalContent,
  ModalDismiss,
  ModalHeader,
  ModalTitle,
  Stack,
  Tag,
  csx,
  useModalState,
} from '@vtex/admin-ui'
import React, { useEffect, useMemo, useRef } from 'react'
import { useIntl } from 'react-intl'
import type {
  Query,
  QueryImportProgressArgs,
} from 'ssesandbox04.catalog-importer'

import {
  ModalButtons,
  SuspenseFallback,
  messages,
  useStatusLabel,
} from '../../common'
import { IMPORT_PROGRESS_QUERY, useQueryCustom } from '../../graphql'
import DeleteConfirmationModal from './DeleteConfirmationModal'
import ImportDetails from './ImportDetails'
import ImportResults from './ImportResults'
import { statusBeforeFinished } from './common'
import { mapStatusToVariant } from './useImportColumns'

type Props = {
  modalState: ReturnType<typeof useModalState>
  id: string
  setDeleted?: React.Dispatch<React.SetStateAction<string[]>>
}

const firstColumnTheme = csx({
  borderBottom: '1px solid $gray20',
  paddingBottom: '$space-4',
  marginBottom: '$space-4',
  '@tablet': {
    paddingRight: '$space-4',
    border: 'none',
    borderRight: '1px solid $gray20',
  },
})

const POLLING_INTERVAL = 1000
const IMPORT_NOT_FOUND_ERROR = 'import-not-found'

const ShowImportModal = ({ modalState, id, setDeleted }: Props) => {
  const { formatMessage } = useIntl()
  const getStatusLabel = useStatusLabel()
  const timeout = useRef<number>()

  const { data, loading, refetch } = useQueryCustom<
    Pick<Query, 'importProgress'>,
    QueryImportProgressArgs
  >(IMPORT_PROGRESS_QUERY, {
    fetchPolicy: 'cache-and-network',
    skip: !id,
    variables: { id },
    onCompleted(dataCompleted) {
      const {
        importProgress: { completed, status },
      } = dataCompleted

      if (statusBeforeFinished(status) || !completed) {
        timeout.current = window.setTimeout(() => refetch(), POLLING_INTERVAL)
      }
    },
    toastError(error) {
      return !error.message.includes(IMPORT_NOT_FOUND_ERROR)
    },
    onError(error) {
      if (error.message.includes(IMPORT_NOT_FOUND_ERROR)) {
        modalState.hide()
      }
    },
  })

  useEffect(() => {
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current)
      }
    }
  }, [])

  const deleteConfirmationModal = useModalState()

  const importProgress = data?.importProgress
  const currentImport = importProgress?.currentImport
  const status = importProgress?.status
  const isLoading = useMemo(() => loading || statusBeforeFinished(status), [
    loading,
    status,
  ])

  const firstLoading = isLoading && !currentImport

  return (
    <Modal state={modalState} size="large">
      <ModalHeader>
        <Stack
          direction="row"
          space="$space-2"
          className={csx({ width: '100%' })}
        >
          <ModalTitle className={csx({ maxWidth: '50%' })}>
            {formatMessage(messages.importDetailsLabel)}
          </ModalTitle>
          {status && (
            <Tag
              label={getStatusLabel(status)}
              variant={mapStatusToVariant[status]}
            />
          )}
        </Stack>
        <ModalDismiss />
      </ModalHeader>
      <ModalContent>
        {firstLoading && <SuspenseFallback />}
        {currentImport && (
          <Columns space={{ mobile: '$space-0', tablet: '$space-4' }}>
            <Column
              units={{ mobile: 12, tablet: 6 }}
              className={firstColumnTheme}
            >
              <ImportDetails currentImport={currentImport} />
            </Column>
            <Column units={{ mobile: 12, tablet: 6 }}>
              <ImportResults
                importProgress={importProgress}
                loading={isLoading}
              />
            </Column>
          </Columns>
        )}
        {id && setDeleted && (
          <ModalButtons>
            <Button
              disabled={
                firstLoading ||
                status === 'TO_BE_DELETED' ||
                status === 'DELETING' ||
                deleteConfirmationModal.open
              }
              variant="critical"
              onClick={() => deleteConfirmationModal.show()}
              icon={<IconTrash />}
            >
              {formatMessage(messages.deleteLabel)}
            </Button>
          </ModalButtons>
        )}
      </ModalContent>
      {deleteConfirmationModal.open && id && setDeleted && (
        <DeleteConfirmationModal
          modalState={deleteConfirmationModal}
          showImportModalState={modalState}
          deleteId={id}
          setDeleted={setDeleted}
        />
      )}
    </Modal>
  )
}

export default ShowImportModal
