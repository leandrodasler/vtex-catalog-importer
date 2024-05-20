import { defineMessages, useIntl } from 'react-intl'

const messages = defineMessages({
  appTitle: { id: 'admin/app.title' },
  versionLabel: { id: 'admin/version.label' },
  categories: { id: 'admin/categories.label' },
})

type MessageKey = keyof typeof messages

const { VTEX_APP_VERSION } = process.env

export const useMessages = () => {
  const intl = useIntl()
  const formattedMessages = Object.keys(messages).reduce((acc, key) => {
    acc[key as MessageKey] = ''

    return acc
  }, {} as Record<MessageKey, string>)

  Object.entries(messages).forEach(([key, value]) => {
    if (key === 'versionLabel') {
      formattedMessages[key as MessageKey] = intl.formatMessage(value, {
        version: VTEX_APP_VERSION,
      })
    } else {
      formattedMessages[key as MessageKey] = intl.formatMessage(value)
    }
  })

  return formattedMessages
}
