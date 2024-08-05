import { sequentialBatch } from '../../helpers'

const handleSkus = async (context: AppEventContext) => {
  const { entity, skuIds, mapProducts } = context.state

  if (!skuIds?.length) return
  const { sourceCatalog, targetCatalog, importEntity } = context.clients
  const { id: executionImportId, settings = {} } = context.state.body
  const { account: sourceAccount } = settings
  const sourceSkus = await sourceCatalog.getSkus(skuIds)

  await sequentialBatch(sourceSkus, async ({ Id, ...sku }) => {
    const { ProductId, IsActive } = sku
    const targetProductId = mapProducts?.[ProductId]
    const { Ean, specifications, files } = await sourceCatalog.getSkuContext(Id)

    const payload = {
      ...sku,
      ProductId: targetProductId,
      IsActive: false,
      ActivateIfPossible: IsActive,
    }

    const { Id: targetId } = await targetCatalog.createSku(payload)

    await Promise.all([
      targetCatalog.associateSkuSpecifications(targetId, specifications),
      targetCatalog.createSkuEan(targetId, Ean),
      targetCatalog.createSkuFiles(targetId, files),
    ])

    await importEntity.save({
      executionImportId,
      name: entity,
      sourceAccount,
      sourceId: Id,
      targetId,
      payload,
    })
  })
}

export default handleSkus
