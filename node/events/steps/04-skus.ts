import { sequentialBatch } from '../../helpers'

const handleSkus = async (context: AppEventContext) => {
  const { entity, skuIds, mapProducts } = context.state

  if (!skuIds?.length) return
  const { sourceCatalog, targetCatalog, importEntity } = context.clients
  const { id: executionImportId, settings = {} } = context.state.body
  const { account: sourceAccount } = settings
  const sourceSkus = await sourceCatalog.getSkus(skuIds)

  await sequentialBatch(sourceSkus, async ({ Id, ...sku }) => {
    const { ProductId, RefId, IsActive } = sku
    const targetProductId = mapProducts?.[ProductId]
    const existing = await targetCatalog.getSkuByRefId(RefId)

    const payload = {
      ...sku,
      ProductId: targetProductId,
      IsActive: false,
      ActivateIfPossible: IsActive,
    }

    const { Id: targetId } = existing
      ? await targetCatalog.updateSku(existing.Id, payload)
      : await targetCatalog.createSku(payload)

    const specifications = await sourceCatalog.getSkuSpecifications(Id)

    await targetCatalog.associateSkuSpecifications(targetId, specifications)

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
