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
import React, { Suspense, lazy } from 'react'
import { useIntl } from 'react-intl'

import { SuspenseFallback } from './components/common'
import messages from './messages'

const ImportWizard = lazy(() => import('./components/ImportWizard'))

const CatalogImporter = () => {
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
            <Suspense fallback={<SuspenseFallback />}>
              <ImportWizard />
            </Suspense>
          </PageContent>
        </Page>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default CatalogImporter
