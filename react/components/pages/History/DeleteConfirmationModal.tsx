import type { useModalState } from '@vtex/admin-ui'
import {
  Button,
  IconTrash,
  Modal,
  ModalContent,
  ModalDismiss,
  ModalHeader,
  ModalTitle,
  Stack,
  Switch,
  Text,
  useSwitchState,
} from '@vtex/admin-ui'
import React from 'react'
import { useIntl } from 'react-intl'

import { InputInlineWrapper, messages, ModalButtons } from '../../common'
import { useDeleteImport } from './common'

type Props = {
  modalState: ReturnType<typeof useModalState>
  showImportModalState: ReturnType<typeof useModalState>
  deleteId: string | undefined
  setDeleted?: React.Dispatch<React.SetStateAction<string[]>>
}

const DeleteConfirmationModal = ({
  modalState,
  deleteId,
  showImportModalState,
  setDeleted,
}: Props) => {
  const { formatMessage } = useIntl()
  const { loading, handleDelete } = useDeleteImport(
    modalState,
    showImportModalState,
    setDeleted
  )

  const checkDeleteState = useSwitchState<boolean>()

  const handleDeleteImport = () => {
    if (deleteId) {
      handleDelete(deleteId)
    }
  }

  return (
    <Modal state={modalState} size="small">
      <ModalHeader>
        <ModalTitle> {formatMessage(messages.importDelete)}</ModalTitle>
        <ModalDismiss disabled={loading} />
      </ModalHeader>
      <ModalContent>
        <Stack space="$space-4">
          <Text>{formatMessage(messages.importDeleteText)}</Text>
          <InputInlineWrapper>
            <Switch
              state={checkDeleteState}
              label={
                <Text variant="action1">
                  {formatMessage(messages.importDeleteCheck)}
                </Text>
              }
            />
          </InputInlineWrapper>
        </Stack>
        <ModalButtons>
          <Button
            loading={loading}
            onClick={handleDeleteImport}
            variant="critical"
            disabled={!checkDeleteState.value}
            icon={<IconTrash />}
          >
            {formatMessage(messages.deleteLabel)}
          </Button>
        </ModalButtons>
      </ModalContent>
    </Modal>
  )
}

export default DeleteConfirmationModal
