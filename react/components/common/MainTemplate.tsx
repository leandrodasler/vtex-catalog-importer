import {
  Flex,
  experimental_I18nProvider as I18nProvider,
  Page,
  PageContent,
  PageHeader,
  PageHeaderActions,
  PageHeaderBottom,
  PageHeaderTitle,
  PageHeaderTop,
  Tag,
  ThemeProvider,
  ToastProvider,
  csx,
} from '@vtex/admin-ui'
import React, { Suspense } from 'react'
import type { MessageDescriptor } from 'react-intl'
import { useIntl } from 'react-intl'
import { useRuntime } from 'vtex.render-runtime'

import { SuspenseFallback, messages } from '.'

type Props = {
  children: React.ReactNode
  subtitle: MessageDescriptor
  onPopNavigation?: () => void
}

const MainTemplate = ({ children, subtitle, onPopNavigation }: Props) => {
  const { culture } = useRuntime()
  const { formatMessage } = useIntl()
  const versionText = formatMessage(messages.versionLabel, {
    version: process.env.VTEX_APP_VERSION,
  })

  return (
    <ThemeProvider>
      <I18nProvider locale={culture.locale}>
        <ToastProvider>
          <Page>
            <PageHeader
              className={csx({ paddingBottom: '$space-2' })}
              onPopNavigation={onPopNavigation}
            >
              <PageHeaderTop>
                <PageHeaderTitle>
                  {formatMessage(messages.appTitle)}
                </PageHeaderTitle>
                <PageHeaderActions>
                  <Flex className={csx({ minWidth: 95 })}>
                    <Tag label={versionText} />
                  </Flex>
                </PageHeaderActions>
              </PageHeaderTop>
              <PageHeaderBottom>
                <h2 className="fw1 t-body">{formatMessage(subtitle)}</h2>
              </PageHeaderBottom>
            </PageHeader>
            <PageContent layout="wide">
              <Suspense fallback={<SuspenseFallback />}>{children}</Suspense>
            </PageContent>
          </Page>
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}

export default MainTemplate
