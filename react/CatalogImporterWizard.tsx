import React, { lazy } from 'react'

import { MainTemplate, messages } from './components/common'

const Wizard = lazy(() => import('./components/pages/Wizard'))

const CatalogImporterWizard = () => (
  <MainTemplate subtitle={messages.wizardTitle}>
    <Wizard />
  </MainTemplate>
)

export default CatalogImporterWizard
