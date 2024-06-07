import { Alert, Center, Stack } from '@vtex/admin-ui'
import React from 'react'
import type { MessageDescriptor } from 'react-intl'
import { useIntl } from 'react-intl'

type GraphQLError = {
  graphQLErrors?: Array<{ message: string }>
  message: string
}

type Props = { error: GraphQLError; title?: MessageDescriptor }

export const ErrorMessage = ({ error, title }: Props) => {
  const { formatMessage } = useIntl()

  return (
    <Center>
      <Alert variant="critical">
        <Stack space="$space-4">
          {title && <span>{formatMessage(title)}</span>}
          <span>
            {formatMessage({
              id: error.graphQLErrors?.[0]?.message ?? error.message,
            })}
          </span>
        </Stack>
      </Alert>
    </Center>
  )
}
