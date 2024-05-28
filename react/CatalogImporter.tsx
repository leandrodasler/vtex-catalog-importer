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
import React from 'react'
import { useIntl } from 'react-intl'

import ImporterSteps from './components/ImporterSteps'
import messages from './messages'

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
            <ImporterSteps />
          </PageContent>
        </Page>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default CatalogImporter
