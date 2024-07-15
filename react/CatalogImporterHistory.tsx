import { Button } from '@vtex/admin-ui'
import React, { lazy } from 'react'
import { useIntl } from 'react-intl'

import { MainTemplate, goToWizardPage, messages } from './components/common'

const History = lazy(() => import('./components/pages/History'))

const CatalogImporterHistory = () => {
  const { formatMessage } = useIntl()

  return (
    <MainTemplate
      subtitle={messages.historyTitle}
      headerActions={
        <Button variant="tertiary" onClick={goToWizardPage}>
          {formatMessage(messages.wizardAction)}
        </Button>
      }
    >
      <History />
    </MainTemplate>
  )
}

export default CatalogImporterHistory
