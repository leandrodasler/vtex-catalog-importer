import { useToast } from '@vtex/admin-ui'
import { useCallback, useRef, useState } from 'react'
import type {
  MutationFunctionOptions,
  MutationHookOptions,
  QueryHookOptions,
} from 'react-apollo'
import { useMutation, useQuery } from 'react-apollo'
import { useIntl } from 'react-intl'
import type { Mutation, Query } from 'ssesandbox04.catalog-importer'

export { default as APP_SETTINGS_QUERY } from './appSettings.graphql'
export { default as CATEGORIES_QUERY } from './categories.graphql'
export { default as DELETE_IMPORT_MUTATION } from './deleteImport.graphql'
export { default as EXECUTE_IMPORT_MUTATION } from './executeImport.graphql'
export { default as IMPORT_PROGRESS_QUERY } from './importProgress.graphql'
export { default as IMPORTS_QUERY } from './imports.graphql'
export { default as WAREHOUSES_QUERY } from './targetWarehouses.graphql'
export { default as UPDATE_APP_SETTINGS_MUTATION } from './updateAppSettings.graphql'

export type GraphQLError = {
  graphQLErrors?: Array<{ message: string }>
  message: string
}

type CustomGraphQLOptions = {
  toastError?: boolean | ((e: GraphQLError) => boolean)
  toastKey?: string
}

type CustomQueryHookOptions<T, V> = QueryHookOptions<T, V> &
  CustomGraphQLOptions

type CustomMutationHookOptions<T, V> = MutationHookOptions<T, V> &
  CustomGraphQLOptions

const MAX_RETRIES = 10
const RETRY_DELAY = 500

export const getGraphQLMessageDescriptor = (error: GraphQLError) => ({
  id: (error.graphQLErrors?.[0]?.message ?? error.message) as string,
})

const useErrorRetry = <T = Query, V = undefined>(
  options?: CustomQueryHookOptions<T, V>
) => {
  const { formatMessage } = useIntl()
  const showToast = useToast()
  const retries = useRef(0)
  const [finishRetries, setFinishRetries] = useState(false)
  const { onError, toastError = true, toastKey: key } = options ?? {}

  const retryError = (e: GraphQLError, refetch: () => void) => {
    const message = e.message.toLowerCase()
    const messageToRetry =
      message.includes('400') ||
      message.includes('408') ||
      message.includes('423') ||
      message.includes('429') ||
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504') ||
      message.includes('network error') ||
      message.includes('networkerror') ||
      message.includes('genericerror') ||
      message.includes('unhealthy') ||
      message.includes('econnrefused')

    if (messageToRetry && retries.current < MAX_RETRIES) {
      window.setTimeout(() => refetch(), RETRY_DELAY * (retries.current + 1))
      retries.current++
    } else {
      const shouldToastError =
        typeof toastError === 'function' ? toastError(e) : toastError

      shouldToastError &&
        showToast({
          message: formatMessage(getGraphQLMessageDescriptor(e)),
          variant: 'critical',
          key,
        })

      setFinishRetries(true)
      onError?.(e)
    }
  }

  return { retries, finishRetries, setFinishRetries, retryError }
}

const getCommonOptions = <T = Query, V = undefined>(
  setFinishRetries: React.Dispatch<React.SetStateAction<boolean>>,
  retries: React.MutableRefObject<number>,
  options?: CustomQueryHookOptions<T, V> | CustomMutationHookOptions<T, V>
) => {
  return {
    notifyOnNetworkStatusChange: true,
    ...options,
    onCompleted(data: T) {
      setFinishRetries(false)
      retries.current = 0
      options?.onCompleted?.(data)
    },
  }
}

export const useQueryCustom = <T = Query, V = undefined>(
  query: T,
  options?: CustomQueryHookOptions<T, V>
) => {
  const {
    retries,
    finishRetries,
    setFinishRetries,
    retryError,
  } = useErrorRetry(options)

  const { refetch, loading, error, ...rest } = useQuery<T, V>(query, {
    ...getCommonOptions(setFinishRetries, retries, options),
    onError(e) {
      retryError(e, refetch)
    },
  })

  return {
    refetch,
    loading: loading || (error && !finishRetries),
    ...(finishRetries && { error }),
    ...rest,
  }
}

export const useMutationCustom = <T = Mutation, V = undefined>(
  mutation: T,
  options?: CustomMutationHookOptions<T, V>
) => {
  const {
    retries,
    finishRetries,
    setFinishRetries,
    retryError,
  } = useErrorRetry(options)

  const [mutationFn, { loading, error, ...rest }] = useMutation<T, V>(
    mutation,
    getCommonOptions(setFinishRetries, retries, options)
  )

  const retryWithLimit = useCallback(
    async (fn: typeof mutationFn, fnOptions: MutationFunctionOptions<T, V>) => {
      return fn(fnOptions).catch((e) => {
        if (retries.current < MAX_RETRIES + 1) {
          retryError(e, () => retryWithLimit(fn, fnOptions))
        }
      })
    },
    [retries, retryError]
  )

  const mutationFactory = useCallback(
    (fnOptions: MutationFunctionOptions<T, V>) => () => {
      retryWithLimit(mutationFn, fnOptions)
    },
    [mutationFn, retryWithLimit]
  )

  return {
    mutationFactory,
    loading: loading || (error && !finishRetries),
    ...(finishRetries && { error }),
    ...rest,
  }
}
