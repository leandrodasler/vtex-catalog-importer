import React, { lazy } from 'react'

import MainTemplate from './components/MainTemplate'
import messages from './messages'

const ImportWizard = lazy(() => import('./components/ImportWizard'))

const CatalogImporter = () => (
  <MainTemplate subtitle={messages.wizardTitle}>
    <ImportWizard />
  </MainTemplate>
)

export default CatalogImporter
