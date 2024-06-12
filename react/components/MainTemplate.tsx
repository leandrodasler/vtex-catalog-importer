import {
  Page,
  PageContent,
  PageHeader,
  PageHeaderActions,
  PageHeaderTitle,
  PageHeaderTop,
  Tag,
  ThemeProvider,
  ToastProvider,
  csx,
} from '@vtex/admin-ui'
import React, { Suspense } from 'react'
import { useIntl } from 'react-intl'

import messages from '../messages'
import { SuspenseFallback } from './common'

type Props = {
  children: React.ReactNode
}

const MainTemplate = ({ children }: Props) => {
  const { formatMessage } = useIntl()

  return (
    <ThemeProvider>
      <ToastProvider>
        <Page>
          <PageHeader>
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
          </PageHeader>
          <PageContent layout="wide" className={csx({ gap: 0 })}>
            <Suspense fallback={<SuspenseFallback />}>{children}</Suspense>
          </PageContent>
        </Page>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default MainTemplate
