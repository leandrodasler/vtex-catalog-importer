import React, { lazy } from 'react'

import { MainTemplate, messages } from './components/common'

const History = lazy(() => import('./components/pages/History'))

const CatalogImporterHistory = () => (
  <MainTemplate subtitle={messages.historyTitle}>
    <History />
  </MainTemplate>
)

export default CatalogImporterHistory
