import type { useModalState } from '@vtex/admin-ui'
import {
  Button,
  IconTrash,
  Modal,
  ModalContent,
  ModalDismiss,
  ModalHeader,
  ModalTitle,
} from '@vtex/admin-ui'
import React from 'react'
import { useIntl } from 'react-intl'

import { messages, ModalButtons } from '../../common'
import { useDeleteImport } from './common'

type Props = {
  modalState: ReturnType<typeof useModalState>
  deleteId: string | undefined
  setDeleted: React.Dispatch<React.SetStateAction<string[]>>
}

const DeleteConfirmationModal = ({
  modalState,
  deleteId,
  setDeleted,
}: Props) => {
  const { formatMessage } = useIntl()
  const { loading, handleDelete } = useDeleteImport(setDeleted, modalState)

  const handleDeleteImport = () => {
    if (deleteId) {
      handleDelete(deleteId)
    }
  }

  return (
    <Modal state={modalState}>
      <ModalHeader>
        <ModalTitle> {formatMessage(messages.importDelete)}</ModalTitle>
        <ModalDismiss disabled={loading} />
      </ModalHeader>
      <ModalContent>
        {formatMessage(messages.importDeleteText)}
        <ModalButtons>
          <Button
            loading={loading}
            onClick={handleDeleteImport}
            variant="critical"
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
