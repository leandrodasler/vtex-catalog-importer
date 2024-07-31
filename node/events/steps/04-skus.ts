import { sequentialBatch } from '../../helpers'

const handleSkus = async (context: AppEventContext) => {
  const { entity, skuIds, mapProducts } = context.state

  if (!skuIds?.length) return
  const { sourceCatalog, targetCatalog, importEntity } = context.clients
  const { id: executionImportId, settings = {} } = context.state.body
  const { account: sourceAccount } = settings
  const sourceSkus = await sourceCatalog.getSkus(skuIds)

  await sequentialBatch(sourceSkus, async ({ Id, ...sku }) => {
    const { ProductId, RefId } = sku
    const targetProductId = mapProducts?.[ProductId]
    const existing = await targetCatalog.getSkuByRefId(RefId)
    const payload = { ...sku, ProductId: targetProductId }
    const { Id: targetId } = existing
      ? await targetCatalog.updateSku(existing.Id, payload)
      : await targetCatalog.createSku(payload)

    await importEntity.save({
      executionImportId,
      name: entity,
      sourceAccount,
      sourceId: Id,
      targetId,
      payload,
      ...(existing && { pathParams: `${targetId}` }),
    })
  })
}

export default handleSkus
