import {
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

import messages from '../messages'
import { SuspenseFallback } from './common'

type Props = {
  children: React.ReactNode
  subtitle: MessageDescriptor
}

const MainTemplate = ({ children, subtitle }: Props) => {
  const { culture } = useRuntime()
  const { formatMessage } = useIntl()

  return (
    <ThemeProvider>
      <I18nProvider locale={culture.locale}>
        <ToastProvider>
          <Page>
            <PageHeader className={csx({ paddingBottom: '$space-2' })}>
              <PageHeaderTop>
                <PageHeaderTitle>
                  {formatMessage(messages.appTitle)}
                </PageHeaderTitle>
                <PageHeaderActions>
                  <Tag
                    label={formatMessage(messages.versionLabel, {
                      version: process.env.VTEX_APP_VERSION,
                    })}
                  />
                </PageHeaderActions>
              </PageHeaderTop>
              <PageHeaderBottom>
                <h2 className="fw1 t-body">{formatMessage(subtitle)}</h2>
              </PageHeaderBottom>
            </PageHeader>
            <PageContent layout="wide" className={csx({ gap: 0 })}>
              <Suspense fallback={<SuspenseFallback />}>{children}</Suspense>
            </PageContent>
          </Page>
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}

export default MainTemplate
