import type { Query } from 'ssesandbox04.catalog-importer'

import { ENDPOINTS, httpGetResolverFactory } from '../../helpers'

export const categories = httpGetResolverFactory<Query['categories']>(
  ENDPOINTS.categories
)
