import {
  Page,
  PageContent,
  PageHeader,
  PageHeaderActions,
  PageHeaderTitle,
  PageHeaderTop,
  ThemeProvider,
} from '@vtex/admin-ui'
import React, { Suspense, lazy } from 'react'
import { useIntl } from 'react-intl'

import messages from './messages'

const CategoryTree = lazy(() => import('./components/CategoryTree'))

const CatalogImporter = () => {
  const { formatMessage } = useIntl()

  return (
    <ThemeProvider>
      <Page>
        <PageHeader>
          <PageHeaderTop>
            <PageHeaderTitle>
              {formatMessage(messages.appTitle)}
            </PageHeaderTitle>
            <PageHeaderActions>
              {formatMessage(messages.versionLabel, {
                version: process.env.VTEX_APP_VERSION,
              })}
            </PageHeaderActions>
          </PageHeaderTop>
        </PageHeader>
        <PageContent layout="wide">
          <Suspense fallback={null}>
            <CategoryTree />
          </Suspense>
        </PageContent>
      </Page>
    </ThemeProvider>
  )
}

export default CatalogImporter
