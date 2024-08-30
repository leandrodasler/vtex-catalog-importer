import { method } from '@vtex/api'

import { batch, ENDPOINTS } from '../helpers'

const cleanCatalog = async (context: Context) => {
  const { privateClient, targetCatalog } = context.clients

  const user = await privateClient.getUser().catch(() => {
    context.status = 401
    context.body = 'Not allowed'
  })

  if (!user) return

  const deleteProducts = async (
    productAndSkuIds: Record<string, number[]>,
    reverse = false
  ) => {
    const productIds = Object.keys(productAndSkuIds)

    return batch(
      reverse ? productIds.reverse() : productIds,
      async (id) => {
        const product = await targetCatalog.get<ProductDetails>(
          ENDPOINTS.product.updateOrDetails(id)
        )

        if (!product.IsActive) return

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
  }

  const productAndSkuIds = await targetCatalog.getProductAndSkuIds()

  deleteProducts(productAndSkuIds).then(() => {
    deleteProducts(productAndSkuIds, true).then(async () => {
      const [allBrands, categories] = await Promise.all([
        targetCatalog.getBrands(),
        targetCatalog.getCategoryTreeFlattened(),
      ])

      const brands = allBrands.filter((b) => b.isActive)

      await batch(brands, (b) => targetCatalog.deleteEntity('brand', b.id), 25)

      await batch(
        categories,
        (c) => targetCatalog.deleteEntity('category', c.id),
        25
      )
    })
  })

  context.status = 200

  context.body = `Catalog cleaned successfully!
=============================================================
${
  Object.keys(productAndSkuIds).length
} products and their skus will be deleted in background, well as all brands and categories.`
}

export default method({ GET: cleanCatalog })
