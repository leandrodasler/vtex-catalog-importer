import type { useModalState } from '@vtex/admin-ui'
import { Skeleton, csx } from '@vtex/admin-ui'
import React, { useCallback, useMemo } from 'react'
import { useMutation } from 'react-apollo'
import type {
  ImportStatus,
  Mutation,
  MutationDeleteImportsArgs,
} from 'ssesandbox04.catalog-importer'
import { useRuntime } from 'vtex.render-runtime'

import { DELETE_IMPORTS_MUTATION } from '../../../graphql'

export const useDeleteImport = (
  setDeleted: React.Dispatch<React.SetStateAction<string[]>>,
  modalState: ReturnType<typeof useModalState>
) => {
  const [deleteImports, { loading }] = useMutation<
    Mutation,
    MutationDeleteImportsArgs
  >(DELETE_IMPORTS_MUTATION, {
    onCompleted(data) {
      setDeleted((prev) => [...prev, ...data.deleteImports])
      modalState.hide()
    },
  })

  const deleteImport = (deleteId: string) => {
    deleteImports({ variables: { ids: [deleteId] } })
  }

  return { loading, deleteImport }
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
      height: 30,
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
