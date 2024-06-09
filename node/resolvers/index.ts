import type { Query as ResolverQuery } from 'ssesandbox04.catalog-importer'

import { ENDPOINTS, getResolverFactory } from '../helpers'
import { brands } from './brands'
import { updateAppSettings } from './updateAppSettings'

const appSettings = async (_: unknown, __: unknown, context: Context) =>
  context.state.body.settings

const categories = getResolverFactory<ResolverQuery['categories']>(
  ENDPOINTS.categories
)

export const Query = {
  appSettings,
  categories,
  brands,
}

export const Mutation = {
  updateAppSettings,
}
