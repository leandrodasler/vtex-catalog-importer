/* eslint-disable no-console */
import { method } from '@vtex/api'

const updateInventory = async (context: Context) => {
  const { data } = await context.clients.targetCatalog.getAllProducts()
  const skus = Object.values(data).flat()
  const payload = { quantity: 1000, unlimitedQuantity: false }

  for await (const sku of skus) {
    console.log('Creating inventory for sku', sku, 'with payload:', payload)
    await context.clients.targetCatalog.createInventory(sku, '1_1', payload)
  }

  context.set('Content-Type', 'application/json')
  context.body = JSON.stringify(skus, null, 2)
}

export default method({ GET: updateInventory })
