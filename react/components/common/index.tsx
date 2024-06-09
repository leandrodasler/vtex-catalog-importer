import { Alert, Center, Spinner, Stack, csx } from '@vtex/admin-ui'
import React from 'react'
import type { MessageDescriptor } from 'react-intl'
import { useIntl } from 'react-intl'

import type { GraphQLError } from '../../graphql'
import { getGraphQLMessageDescriptor } from '../../graphql'

type Props = { error: GraphQLError; title?: MessageDescriptor }

export const ErrorMessage = ({ error, title }: Props) => {
  const { formatMessage } = useIntl()

  return (
    <Center>
      <Alert variant="critical">
        <Stack space="$space-4">
          {title && <span>{formatMessage(title)}</span>}
          <span>{formatMessage(getGraphQLMessageDescriptor(error))}</span>
        </Stack>
      </Alert>
    </Center>
  )
}

export const SuspenseFallback = () => (
  <Center className={csx({ height: '25vh' })}>
    <Spinner />
  </Center>
)
