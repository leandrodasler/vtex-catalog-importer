import type { Query } from 'ssesandbox04.catalog-importer'

import { ENDPOINTS } from '../../helpers'

export const categories = async (_: unknown, __: unknown, context: Context) =>
  context.clients.httpClient.get<Query['categories']>(ENDPOINTS.categoryTree)
