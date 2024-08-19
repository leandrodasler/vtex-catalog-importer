import { sequentialBatch } from '../../helpers'

const handleSkus = async (context: AppEventContext) => {
  const { entity, skuIds, mapProduct } = context.state

  if (!skuIds?.length || !mapProduct) return

  const { sourceCatalog, targetCatalog, importEntity } = context.clients
  const {
    id: executionImportId,
    settings = {},
    importImages = true,
  } = context.state.body

  const { account: sourceAccount } = settings
  const sourceSkus = await sourceCatalog.getSkus(skuIds)
  const mapSku: EntityMap = {}
  const mapSourceSkuProduct: EntityMap = {}

  await sequentialBatch(sourceSkus, async ({ Id, ...sku }) => {
    const { ProductId, IsActive } = sku
    const targetProductId = mapProduct[ProductId]
    const skuContext = await sourceCatalog.getSkuContext(Id, importImages)
    const { Ean, specifications, files } = skuContext

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
      title: sku.Name,
    })

    mapSku[Id] = targetId
    mapSourceSkuProduct[Id] = ProductId
  })

  context.state.mapSku = mapSku
  context.state.mapSourceSkuProduct = mapSourceSkuProduct
}

export default handleSkus
