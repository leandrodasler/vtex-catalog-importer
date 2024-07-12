import type { useModalState } from '@vtex/admin-ui'
import { Skeleton, csx } from '@vtex/admin-ui'
import React, { useCallback } from 'react'
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
  const {
    culture: { locale },
  } = useRuntime()

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

export const POLLING_INTERVAL = 3000

export const EntitySkeleton = () => <Skeleton className={csx({ height: 20 })} />
