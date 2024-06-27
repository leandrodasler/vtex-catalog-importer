import type { useModalState } from '@vtex/admin-ui'
import {
  Button,
  Modal,
  ModalContent,
  ModalDismiss,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  Spinner,
  Text,
} from '@vtex/admin-ui'
import React from 'react'
import type { Import } from 'ssesandbox04.catalog-importer'
import { useRuntime } from 'vtex.render-runtime'

import { useDeleteImport } from '.'
import { Checked, Unchecked, useStockOptionLabel } from '../../../common'

type ConfirmeModalProps = {
  openInfosImportmodal: ReturnType<typeof useModalState>
  infoModal?: Import
}

export const ConfirmeModal: React.FC<ConfirmeModalProps> = ({
  openInfosImportmodal,
  infoModal,
}) => {
  const {
    culture: { locale },
  } = useRuntime()

  const getStockOptionLabel = useStockOptionLabel()

  return (
    <Modal state={openInfosImportmodal}>
      <ModalHeader>
        <ModalTitle>Modal title</ModalTitle>
        <ModalDismiss />
      </ModalHeader>
      <ModalContent>
        {infoModal && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text style={{ display: 'flex', gap: '0.5rem' }}>
              <h6>ID:</h6> {infoModal.id}
            </Text>
            <Text style={{ display: 'flex', gap: '0.5rem' }}>
              <h6>Created In:</h6>
              {new Date(infoModal.createdIn).toLocaleString(locale)}
            </Text>
            <Text style={{ display: 'flex', gap: '0.5rem' }}>
              <h6> Last Interaction in:</h6>
              {new Date(infoModal.lastInteractionIn).toLocaleString(locale)}
            </Text>
            <Text style={{ display: 'flex', gap: '0.5rem' }}>
              <h6>User: </h6>
              {infoModal.user}
            </Text>
            <Text style={{ display: 'flex', gap: '0.5rem' }}>
              <h6>Import Images:</h6>
              {infoModal.importImages ? <Checked /> : <Unchecked />}
            </Text>
            <Text style={{ display: 'flex', gap: '0.5rem' }}>
              <h6> Import Prices:</h6>
              {infoModal.importPrices ? <Checked /> : <Unchecked />}
            </Text>
            {infoModal.stockValue && (
              <Text style={{ display: 'flex', gap: '0.5rem' }}>
                <h6>Stock to be defined for all SKUs:</h6>{' '}
                {infoModal.stockValue}
              </Text>
            )}
            <Text style={{ display: 'flex', gap: '0.5rem' }}>
              <h6>Stock Option: </h6>
              {getStockOptionLabel(infoModal.stocksOption).toLowerCase()}
            </Text>
            {infoModal.categoryTree && (
              <Text style={{ display: 'flex', gap: '0.5rem' }}>
                <h6>Category Tree:</h6> {infoModal.categoryTree}
              </Text>
            )}
            <Text style={{ display: 'flex', gap: '0.5rem' }}>
              <h6>Status:</h6> {infoModal.status.toLowerCase()}
            </Text>

            <Text style={{ display: 'flex', gap: '0.5rem' }}>
              <h6>Source VTEX Account: </h6>
              {infoModal.settings.useDefault ? (
                <Text>Default</Text>
              ) : (
                <Text> {infoModal.settings.account}</Text>
              )}
            </Text>
          </div>
        )}
      </ModalContent>
    </Modal>
  )
}

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
        <ModalTitle>Deseja mesmo excluir o import?</ModalTitle>
        <ModalDismiss />
      </ModalHeader>
      <ModalFooter>
        <Button onClick={handleDelete} style={{ backgroundColor: 'red' }}>
          {loading ? <Spinner /> : 'Excluir'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
