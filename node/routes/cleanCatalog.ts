import { method } from '@vtex/api'

import { batch, ENDPOINTS } from '../helpers'

const cleanCatalog = async (context: Context) => {
  const { privateClient, targetCatalog } = context.clients

  const user = await privateClient.getUser().catch(() => {
    context.status = 401
    context.body = 'Not allowed'
  })

  if (!user) return

  const productAndSkuIds = await targetCatalog.getProductAndSkuIds()

  batch(
    Object.keys(productAndSkuIds),
    async (id) => {
      const product = await targetCatalog.get<ProductDetails>(
        ENDPOINTS.product.updateOrDetails(id)
      )

      if (!product.Name.includes('DELETED-')) return

      await targetCatalog.deleteEntity('product', id)

      const skuIds = productAndSkuIds[id]

      await batch(
        skuIds,
        (skuId) => targetCatalog.deleteEntity('sku', skuId),
        25
      )
    },
    25
  )

  context.status = 200
  context.body = 'Catalog cleaned successfully'
}

export default method({ GET: cleanCatalog })
