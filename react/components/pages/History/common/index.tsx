import type { useModalState } from '@vtex/admin-ui'
import { Skeleton, csx } from '@vtex/admin-ui'
import React, { useCallback, useMemo } from 'react'
import type {
  ImportStatus,
  Mutation,
  MutationDeleteImportArgs,
} from 'ssesandbox04.catalog-importer'
import { useRuntime } from 'vtex.render-runtime'

import { DELETE_IMPORT_MUTATION, useMutationCustom } from '../../../graphql'

export const useDeleteImport = (
  modalState: ReturnType<typeof useModalState>,
  showImportModalState: ReturnType<typeof useModalState>,
  setDeleted?: React.Dispatch<React.SetStateAction<string[]>>
) => {
  const { mutationFactory, loading } = useMutationCustom<
    Mutation,
    MutationDeleteImportArgs
  >(DELETE_IMPORT_MUTATION, {
    toastKey: 'deleteImport',
    onCompleted(data) {
      setDeleted?.((prev) => [...prev, data.deleteImport])
      modalState.hide()
      showImportModalState.hide()
    },
  })

  const handleDelete = (id: string) => mutationFactory({ variables: { id } })()

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

type EntitySkeletonProps = { width?: string }
const entitySkeletonTheme = csx({
  height: 32,
  background: '$gray10',
  '--admin-ui-bg-skeleton':
    'linear-gradient(90deg, var(--admin-ui-colors-transparent), var(--admin-ui-colors-gray30), var(--admin-ui-colors-transparent))',
  '&[data-shape="rect"]': { borderRadius: 0, transition: 'width linear 1s' },
})

export const EntitySkeleton = ({ width }: EntitySkeletonProps) => (
  <Skeleton style={{ width }} className={entitySkeletonTheme} />
)

export const statusBeforeFinished = (status?: ImportStatus) =>
  status === 'PENDING' ||
  status === 'RUNNING' ||
  status === 'TO_BE_DELETED' ||
  status === 'DELETING'
