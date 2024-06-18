import React, { lazy } from 'react'

import { MainTemplate, goToWizardPage, messages } from './components/common'

const History = lazy(() => import('./components/pages/History'))

const CatalogImporterHistory = () => (
  <MainTemplate
    subtitle={messages.historyTitle}
    onPopNavigation={goToWizardPage}
  >
    <History />
  </MainTemplate>
)

export default CatalogImporterHistory
