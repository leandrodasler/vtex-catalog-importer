/* eslint-disable no-console */
import { method } from '@vtex/api'

import { batch, ENDPOINTS } from '../helpers'

const populateSource = async (context: Context) => {
  // const { adminAuth, cosmos } = context.clients
  const { privateClient, targetCatalog } = context.clients

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

  // console.log('cleaning brands')
  // const brands = await targetCatalog.get<Brand[]>(ENDPOINTS.brand.list)

  // batch(
  //   brands,
  //   ({ id }) => +id > 2000005 && targetCatalog.deleteEntity('brand', id),
  //   25
  // )

  // console.log('cleaning categories')
  // const categories = sourceCatalog.flatCategoryTree(
  //   await targetCatalog.get<Category[]>(ENDPOINTS.category.list)
  // )

  // batch(
  //   categories,
  //   ({ id }) => +id > 7 && targetCatalog.deleteEntity('category', id),
  //   25
  // )

  // console.log('cleaning products')
  // targetCatalog.getProductIds(12).then(({ productIds, skuIds }) => {
  //   batch(productIds, (id) => targetCatalog.deleteEntity('product', id), 25)
  //   batch(skuIds, (id) => targetCatalog.deleteEntity('sku', id), 25)
  // })

  const { result, productIds } = await targetCatalog.getProductIds()

  console.log('product and sku ids:', result)

  batch(
    productIds,
    async (id) => {
      const product = await targetCatalog.get<ProductDetails>(
        ENDPOINTS.product.updateOrDetails(id)
      )

      if (product.Name.includes('DELETED-')) {
        const skuIds = result[id]

        await batch(
          skuIds,
          (skuId) => targetCatalog.deleteEntity('sku', skuId),
          25
        )
      }
    },
    25
  )

  context.status = 200
  context.body = 'Catalog cleaned successfully'
}

export default method({ GET: populateSource })
