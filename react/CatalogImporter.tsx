import {
  Page,
  PageContent,
  PageHeader,
  PageHeaderActions,
  PageHeaderButton,
  PageHeaderTitle,
  PageHeaderTop,
  ThemeProvider,
  ToastProvider,
} from '@vtex/admin-ui'
import React, { Suspense, lazy } from 'react'
import { useIntl } from 'react-intl'

import { goToSettings } from './helpers'
import messages from './messages'

const CategoryTree = lazy(() => import('./components/CategoryTree'))

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
                <span className="ml4 c-muted-1">
                  {formatMessage(messages.versionLabel, {
                    version: process.env.VTEX_APP_VERSION,
                  })}
                </span>
              </PageHeaderTitle>
              <PageHeaderActions>
                <PageHeaderButton variant="secondary" onClick={goToSettings}>
                  {formatMessage(messages.settingsLabel)}
                </PageHeaderButton>
              </PageHeaderActions>
            </PageHeaderTop>
          </PageHeader>
          <PageContent layout="wide">
            <Suspense fallback={null}>
              <CategoryTree />
            </Suspense>
          </PageContent>
        </Page>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default CatalogImporter
