import type { useModalState } from '@vtex/admin-ui'
import { Skeleton, csx, useToast } from '@vtex/admin-ui'
import React, { useCallback, useMemo } from 'react'
import { useMutation } from 'react-apollo'
import { useIntl } from 'react-intl'
import type {
  ImportStatus,
  Mutation,
  MutationDeleteImportArgs,
} from 'ssesandbox04.catalog-importer'
import { useRuntime } from 'vtex.render-runtime'

import {
  DELETE_IMPORT_MUTATION,
  getGraphQLMessageDescriptor,
} from '../../../graphql'

export const useDeleteImport = (
  setDeleted: React.Dispatch<React.SetStateAction<string[]>>,
  modalState: ReturnType<typeof useModalState>
) => {
  const showToast = useToast()
  const { formatMessage } = useIntl()

  const [deleteImport, { loading }] = useMutation<
    Mutation,
    MutationDeleteImportArgs
  >(DELETE_IMPORT_MUTATION, {
    onError(e) {
      showToast({
        message: formatMessage(getGraphQLMessageDescriptor(e)),
        variant: 'critical',
      })
    },
    onCompleted(data) {
      setDeleted((prev) => [...prev, data.deleteImport])
      modalState.hide()
    },
  })

  const handleDelete = (id: string) => deleteImport({ variables: { id } })

  return { loading, handleDelete }
}

export const useLocaleDate = () => {
  const { locale } = useRuntime().culture

  const getStartedAt = useCallback(
    (date: string) => new Date(date).toLocaleString(locale),
    [locale]
  )

  const getFinishedAt = useCallback(
    (date: string, status: ImportStatus) =>
      status === 'ERROR' || status === 'SUCCESS'
        ? new Date(date).toLocaleString(locale)
        : '---',
    [locale]
  )

  return { getStartedAt, getFinishedAt }
}

export const useLocalePercentage = (current: number, total: number) => {
  const { locale } = useRuntime().culture

  const percentage = useMemo(() => (total ? (current / total) * 100 : 0), [
    current,
    total,
  ])

  const localePercentage = useMemo(
    () =>
      (percentage / 100).toLocaleString(locale, {
        style: 'percent',
        maximumFractionDigits: 2,
      }),
    [percentage, locale]
  )

  return { percentage, localePercentage }
}

type EntitySkeletonProps = { width?: string | number }
export const EntitySkeleton = ({ width }: EntitySkeletonProps) => (
  <Skeleton
    className={csx({
      height: 32,
      background: '$gray10',
      width,
      '--admin-ui-bg-skeleton':
        'linear-gradient(90deg, var(--admin-ui-colors-transparent), var(--admin-ui-colors-gray30), var(--admin-ui-colors-transparent))',
      '&[data-shape="rect"]': { borderRadius: 0 },
    })}
  />
)

export const statusBeforeFinished = (status?: ImportStatus) =>
  status === 'PENDING' || status === 'RUNNING'
