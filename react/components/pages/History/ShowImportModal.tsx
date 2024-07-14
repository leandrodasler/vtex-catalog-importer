import type { useModalState } from '@vtex/admin-ui'
import {
  Column,
  Columns,
  Modal,
  ModalContent,
  ModalDismiss,
  ModalHeader,
  ModalTitle,
  csx,
} from '@vtex/admin-ui'
import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'
import type {
  Query,
  QueryImportProgressArgs,
} from 'ssesandbox04.catalog-importer'

import { SuspenseFallback, messages } from '../../common'
import { IMPORT_PROGRESS_QUERY, useQueryCustom } from '../../graphql'
import ImportDetails from './ImportDetails'
import ImportResults from './ImportResults'

type Props = {
  modalState: ReturnType<typeof useModalState>
  id: string
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

const ShowImportModal = ({ modalState, id }: Props) => {
  const { formatMessage } = useIntl()

  const { data, loading, refetch } = useQueryCustom<
    Query,
    QueryImportProgressArgs
  >(IMPORT_PROGRESS_QUERY, {
    skip: !id,
    variables: { id },
    onCompleted({ importProgress: { currentImport, brands } }) {
      const { status, sourceBrandsTotal } = currentImport

      if (status !== 'ERROR' && brands < sourceBrandsTotal) {
        refetch()
      }
    },
  })

  const importProgress = data?.importProgress
  const currentImport = importProgress?.currentImport
  const status = currentImport?.status
  const isLoading = useMemo(
    () => loading || status === 'PENDING' || status === 'RUNNING',
    [loading, status]
  )

  return (
    <Modal state={modalState} size="large">
      <ModalHeader>
        <ModalTitle>{formatMessage(messages.importDetailsLabel)}</ModalTitle>
        <ModalDismiss />
      </ModalHeader>
      <ModalContent>
        {isLoading && !currentImport && <SuspenseFallback />}
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
      </ModalContent>
    </Modal>
  )
}

export default ShowImportModal
