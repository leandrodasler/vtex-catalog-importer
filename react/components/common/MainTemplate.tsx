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
  Stack,
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
  headerActions?: React.ReactNode
}

const MainTemplate = ({ children, subtitle, headerActions }: Props) => {
  const { locale } = useRuntime().culture
  const { formatMessage } = useIntl()
  const versionText = formatMessage(messages.versionLabel, {
    version: process.env.VTEX_APP_VERSION,
  })

  return (
    <ThemeProvider>
      <I18nProvider locale={locale}>
        <ToastProvider>
          <Page
            className={csx({
              'button[data-size="normal"]': { height: 'auto' },
            })}
          >
            <PageHeader className={csx({ paddingBottom: '$space-2' })}>
              <PageHeaderTop>
                <PageHeaderTitle>
                  {formatMessage(messages.appTitle)}
                </PageHeaderTitle>
                <PageHeaderActions>
                  <Stack align="end" space="$space-2">
                    <Flex className={csx({ minWidth: 95 })}>
                      <Tag label={versionText} />
                    </Flex>
                    {headerActions}
                  </Stack>
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
