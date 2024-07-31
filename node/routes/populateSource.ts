/* eslint-disable no-console */
import { method } from '@vtex/api'
import type { Category } from 'ssesandbox04.catalog-importer'

import { batch, ENDPOINTS } from '../helpers'

const populateSource = async (context: Context) => {
  // const { adminAuth, cosmos } = context.clients
  const { adminAuth, targetCatalog, sourceCatalog } = context.clients

  const user = await adminAuth.getUser().catch(() => {
    context.status = 401
    context.body = 'Not allowed'
  })

  if (!user) return
  // const { gpc = '' } = context.query

  // if (!gpc.trim()) {
  //   context.status = 400
  //   context.body = 'Provide a valid GPC at "gpc" query param'

  //   return
  // }

  // const products = await cosmos.getProductsByGpc(gpc)

  console.log('cleaning brands')
  const brands = await targetCatalog.get<Brand[]>(ENDPOINTS.brand.list)

  batch(brands, ({ id }) => targetCatalog.deleteEntity('brand', id))

  console.log('cleaning categories')
  const categories = sourceCatalog.flatCategoryTree(
    await targetCatalog.get<Category[]>(ENDPOINTS.category.list)
  )

  batch(categories, ({ id }) => targetCatalog.deleteEntity('category', id))

  console.log('cleaning products')
  targetCatalog
    .getProductIds()
    .then((productIds) =>
      batch(productIds, (id) => targetCatalog.deleteEntity('product', id))
    )

  context.status = 200
  context.body = 'Catalog cleaned successfully'
  // context.body = JSON.stringify(products, null, 2)
}

export default method({ GET: populateSource })
