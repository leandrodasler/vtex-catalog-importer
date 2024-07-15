import { Button } from '@vtex/admin-ui'
import React, { lazy } from 'react'
import { useIntl } from 'react-intl'

import { goToHistoryPage, MainTemplate, messages } from './components/common'

const Wizard = lazy(() => import('./components/pages/Wizard'))

const CatalogImporterWizard = () => {
  const { formatMessage } = useIntl()

  return (
    <MainTemplate
      subtitle={messages.wizardTitle}
      headerActions={
        <Button variant="tertiary" onClick={() => goToHistoryPage()}>
          {formatMessage(messages.historyAction)}
        </Button>
      }
    >
      <Wizard />
    </MainTemplate>
  )
}

export default CatalogImporterWizard
