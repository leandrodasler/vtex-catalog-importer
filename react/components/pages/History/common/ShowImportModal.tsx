import type { useModalState } from '@vtex/admin-ui'
import {
  Column,
  Columns,
  Modal,
  ModalContent,
  ModalDismiss,
  ModalHeader,
  ModalTitle,
  Spinner,
  Stack,
  csx,
} from '@vtex/admin-ui'
import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'
import type {
  Query,
  QueryImportProgressArgs,
} from 'ssesandbox04.catalog-importer'

import type { ImportChangedStatus } from '.'
import { ImportDetails, ImportResults } from '.'
import { SuspenseFallback, messages } from '../../../common'
import { IMPORT_PROGRESS_QUERY, useQueryCustom } from '../../../graphql'

type ShowImportModalProps = {
  openInfosImportmodal: ReturnType<typeof useModalState>
  setChangedStatus: React.Dispatch<
    React.SetStateAction<ImportChangedStatus | undefined>
  >
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

const secondColumnTheme = csx({ overflow: 'auto' })
const POLLING_INTERVAL = 3000

export const ShowImportModal = ({
  openInfosImportmodal,
  setChangedStatus,
  id,
}: ShowImportModalProps) => {
  const { formatMessage } = useIntl()

  const { data, loading, startPolling, stopPolling } = useQueryCustom<
    Query,
    QueryImportProgressArgs
  >(IMPORT_PROGRESS_QUERY, {
    skip: !id,
    variables: { id },
    onCompleted(result) {
      const { status } = result.importProgress.currentImport

      setChangedStatus((prev) => ({ ...prev, [id]: status }))

      if (status === 'PENDING' || status === 'RUNNING') {
        startPolling(POLLING_INTERVAL)
      } else {
        stopPolling()
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
    <Modal state={openInfosImportmodal} size="large">
      <ModalHeader>
        <ModalTitle>{formatMessage(messages.importDetailsLabel)}</ModalTitle>
        <Stack direction="row" space="$space-4">
          {isLoading && currentImport && <Spinner />}
          <ModalDismiss />
        </Stack>
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
            <Column
              units={{ mobile: 12, tablet: 6 }}
              className={secondColumnTheme}
            >
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
