import React, { lazy } from 'react'

import MainTemplate from './components/MainTemplate'

const ImportHistory = lazy(() => import('./components/ImportHistory'))

const CatalogImporter = () => (
  <MainTemplate>
    <ImportHistory />
  </MainTemplate>
)

export default CatalogImporter
