import type { useModalState } from '@vtex/admin-ui'
import {
  Column,
  Columns,
  Modal,
  ModalContent,
  ModalDismiss,
  ModalHeader,
  ModalTitle,
  Stack,
  Tag,
  csx,
} from '@vtex/admin-ui'
import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'
import type {
  Query,
  QueryImportProgressArgs,
} from 'ssesandbox04.catalog-importer'

import { SuspenseFallback, messages, useStatusLabel } from '../../common'
import { IMPORT_PROGRESS_QUERY, useQueryCustom } from '../../graphql'
import ImportDetails from './ImportDetails'
import ImportResults from './ImportResults'
import { statusBeforeFinished } from './common'
import { mapStatusToVariant } from './useImportColumns'

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

const POLLING_INTERVAL = 100

const ShowImportModal = ({ modalState, id }: Props) => {
  const { formatMessage } = useIntl()
  const getStatusLabel = useStatusLabel()

  const { data, loading, refetch } = useQueryCustom<
    Query,
    QueryImportProgressArgs
  >(IMPORT_PROGRESS_QUERY, {
    skip: !id,
    variables: { id },
    onCompleted({ importProgress: { completed, status } }) {
      if (statusBeforeFinished(status) || !completed) {
        setTimeout(() => refetch(), POLLING_INTERVAL)
      }
    },
  })

  const importProgress = data?.importProgress
  const currentImport = importProgress?.currentImport
  const status = importProgress?.status
  const isLoading = useMemo(() => loading || statusBeforeFinished(status), [
    loading,
    status,
  ])

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
