import React, { lazy } from 'react'

import MainTemplate from './components/MainTemplate'
import messages from './messages'

const ImportHistory = lazy(() => import('./components/ImportHistory'))

const CatalogImporter = () => (
  <MainTemplate subtitle={messages.historyTitle}>
    <ImportHistory />
  </MainTemplate>
)

export default CatalogImporter
