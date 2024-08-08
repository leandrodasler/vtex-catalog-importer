/* eslint-disable no-console */
import { method } from '@vtex/api'
import type { Category } from 'ssesandbox04.catalog-importer'

import { batch, ENDPOINTS } from '../helpers'

const populateSource = async (context: Context) => {
  // const { adminAuth, cosmos } = context.clients
  const { privateClient, targetCatalog, sourceCatalog } = context.clients

  const user = await privateClient.getUser().catch(() => {
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
  // context.body = JSON.stringify(products, null, 2)

  console.log('cleaning brands')
  const brands = await targetCatalog.get<Brand[]>(ENDPOINTS.brand.list)

  batch(
    brands,
    ({ id }) => +id > 2000005 && targetCatalog.deleteEntity('brand', id)
  )

  console.log('cleaning categories')
  const categories = sourceCatalog.flatCategoryTree(
    await targetCatalog.get<Category[]>(ENDPOINTS.category.list)
  )

  batch(
    categories,
    ({ id }) => +id > 7 && targetCatalog.deleteEntity('category', id)
  )

  console.log('cleaning products')
  targetCatalog.getProductIds(12).then(({ productIds, skuIds }) => {
    batch(productIds, (id) => targetCatalog.deleteEntity('product', id))
    batch(skuIds, (id) => targetCatalog.deleteEntity('sku', id))
  })

  context.status = 200
  context.body = 'Catalog cleaned successfully'
}

export default method({ GET: populateSource })
