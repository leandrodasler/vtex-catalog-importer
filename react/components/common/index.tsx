import {
  Alert,
  Center,
  IconCheckCircle,
  IconXCircle,
  Spinner,
  Stack,
  csx,
} from '@vtex/admin-ui'
import React, { useEffect, useState } from 'react'
import type { MessageDescriptor } from 'react-intl'
import { useIntl } from 'react-intl'
import type { Import } from 'ssesandbox04.catalog-importer'

import type { GraphQLError } from '../graphql'
import { getGraphQLMessageDescriptor } from '../graphql'
import { messages } from './messages'

type ErrorMessageProps = { error: GraphQLError; title?: MessageDescriptor }

export const SuspenseFallback = () => (
  <Center className={csx({ height: '25vh', width: '100%' })}>
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
      setCurrentSeconds((prev) => prev - 1)
    }, 1000)

    return () => {
      clearTimeout(timer)
    }
  }, [currentSeconds])

  return (
    <>
      {currentSeconds < 10 && '0'}
      {currentSeconds}
    </>
  )
}

export const Checked = () => {
  const { formatMessage } = useIntl()

  return (
    <IconCheckCircle
      title={formatMessage(messages.yesLabel)}
      weight="fill"
      className={csx({ color: '$positive' })}
    />
  )
}

export const Unchecked = () => {
  const { formatMessage } = useIntl()

  return (
    <IconXCircle
      title={formatMessage(messages.noLabel)}
      weight="fill"
      className={csx({ color: '$critical' })}
    />
  )
}

export const useStatusLabel = () => {
  const { formatMessage } = useIntl()

  return (status: Import['status']) =>
    formatMessage(
      messages[`importStatus${status}Label` as keyof typeof messages]
    )
}

export const useStockOptionLabel = () => {
  const { formatMessage } = useIntl()

  return (option: Import['stocksOption']) =>
    formatMessage(messages[`options${option}` as keyof typeof messages])
}

export const goToHistoryPage = () => {
  window.parent.location.href = '/admin/catalog-importer/history'
}

export const goToWizardPage = () => {
  window.parent.location.href = '/admin/catalog-importer/wizard'
}

export { default as MainTemplate } from './MainTemplate'
export { messages } from './messages'
