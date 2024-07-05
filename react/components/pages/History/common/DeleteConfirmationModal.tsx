import type { useModalState } from '@vtex/admin-ui'
import {
  Button,
  IconTrash,
  Modal,
  ModalContent,
  ModalDismiss,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@vtex/admin-ui'
import React from 'react'
import { useIntl } from 'react-intl'

import { useDeleteImport } from '.'
import { messages } from '../../../common'

type DeleteConfirmationModalProps = {
  openDeleteConfirmationModal: ReturnType<typeof useModalState>
  deleteId: string | undefined
  setDeleted: React.Dispatch<React.SetStateAction<string[]>>
}
export const DeleteConfirmationModal = ({
  openDeleteConfirmationModal,
  deleteId,
  setDeleted,
}: DeleteConfirmationModalProps) => {
  const { formatMessage } = useIntl()
  const { loading, deleteImport } = useDeleteImport(
    setDeleted,
    openDeleteConfirmationModal
  )

  const handleDelete = () => {
    if (deleteId) {
      deleteImport(deleteId)
    }
  }

  return (
    <Modal state={openDeleteConfirmationModal}>
      <ModalHeader>
        <ModalTitle> {formatMessage(messages.importDelete)}</ModalTitle>
        <ModalDismiss />
      </ModalHeader>
      <ModalContent>{formatMessage(messages.importDeleteText)}</ModalContent>
      <ModalFooter>
        <Button
          loading={loading}
          onClick={handleDelete}
          variant="critical"
          icon={<IconTrash />}
        >
          {formatMessage(messages.deleteLabel)}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
