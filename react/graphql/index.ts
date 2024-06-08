import { useToast } from '@vtex/admin-ui'
import { useRef, useState } from 'react'
import type { QueryHookOptions } from 'react-apollo'
import { useQuery } from 'react-apollo'
import { useIntl } from 'react-intl'
import type { Query } from 'ssesandbox04.catalog-importer'

export { default as APP_SETTINGS_QUERY } from './appSettings.graphql'
export { default as CATEGORIES_QUERY } from './categories.graphql'
export { default as UPDATE_APP_SETTINGS_MUTATION } from './updateAppSettings.graphql'

const MAX_RETRIES = 5
const RETRY_DELAY = 500

export const useQueryCustom = <T = Query, V = undefined>(
  query: T,
  options?: QueryHookOptions<T, V> & { toastError?: boolean }
) => {
  const { formatMessage } = useIntl()
  const showToast = useToast()
  const retries = useRef(0)
  const [finishRetries, setFinishRetries] = useState(false)
  const { onError, toastError = true } = options ?? {}

  const { refetch, loading, error, ...rest } = useQuery<T, V>(query, {
    notifyOnNetworkStatusChange: true,
    onError(e) {
      if (e.message.includes('500') && retries.current < MAX_RETRIES) {
        setTimeout(() => refetch(), RETRY_DELAY)
        retries.current++
      } else {
        toastError &&
          showToast({
            message: formatMessage({
              id: e.graphQLErrors?.[0]?.message || e.message,
            }),
            variant: 'critical',
          })

        setFinishRetries(true)
        onError?.(e)
      }
    },
    ...options,
  })

  return {
    refetch,
    loading: loading || (error !== undefined && !finishRetries),
    ...(finishRetries && { error }),
    ...rest,
  }
}
