import {
  IconGear,
  Page,
  PageContent,
  PageHeader,
  PageHeaderActions,
  PageHeaderButton,
  PageHeaderTitle,
  PageHeaderTop,
  Tag,
  ThemeProvider,
  ToastProvider,
} from '@vtex/admin-ui'
import React from 'react'
import { useIntl } from 'react-intl'

import ImporterSteps from './components/ImporterSteps'
import { goToSettings } from './helpers'
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
                <Tag
                  label={formatMessage(messages.versionLabel, {
                    version: process.env.VTEX_APP_VERSION,
                  })}
                />
              </PageHeaderTitle>
              <PageHeaderActions>
                <PageHeaderButton
                  variant="secondary"
                  onClick={goToSettings}
                  icon={<IconGear />}
                >
                  {formatMessage(messages.settingsLabel)}
                </PageHeaderButton>
              </PageHeaderActions>
            </PageHeaderTop>
          </PageHeader>
          <PageContent layout="wide">
            <ImporterSteps />
          </PageContent>
        </Page>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default CatalogImporter
