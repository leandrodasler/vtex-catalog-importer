import { Alert, Center, Spinner, Stack, csx } from '@vtex/admin-ui'
import React, { useEffect, useState } from 'react'
import type { MessageDescriptor } from 'react-intl'
import { useIntl } from 'react-intl'

import type { GraphQLError } from '../graphql'
import { getGraphQLMessageDescriptor } from '../graphql'

type ErrorMessageProps = { error: GraphQLError; title?: MessageDescriptor }

export const SuspenseFallback = () => (
  <Center className={csx({ height: '25vh' })}>
    <Spinner />
  </Center>
)

export const ErrorMessage = ({ error, title }: ErrorMessageProps) => {
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

export const handleTrim = (e: React.FormEvent<HTMLInputElement>) => {
  e.currentTarget.value = e.currentTarget.value.trim()
}

type CountdownProps = { seconds: number }
export const Countdown = ({ seconds }: CountdownProps) => {
  const [currentSeconds, setCurrentSeconds] = useState(seconds)

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentSeconds(currentSeconds - 1)
    }, 1000)

    return () => {
      clearTimeout(timer)
    }
  }, [currentSeconds])

  return <>{currentSeconds}</>
}

export { default as MainTemplate } from './MainTemplate'
export { messages } from './messages'
