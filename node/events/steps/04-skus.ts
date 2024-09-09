import { batch, getEntityBySourceId, incrementVBaseEntity } from '../../helpers'

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
  const lastSkuId = await targetCatalog.getLastSkuId()
  const sourceSkus = await sourceCatalog.getSkus(skuIds, lastSkuId)
  const mapSku: EntityMap = {}
  const mapSourceSkuProduct: EntityMap = {}

  await batch(sourceSkus, async ({ Id, newId, RefId, ...sku }) => {
    const migrated = await getEntityBySourceId(context, Id)

    if (migrated?.targetId) {
      mapSku[Id] = +migrated.targetId
    }

    if (mapSku[Id]) return

    const { ProductId, IsActive } = sku
    const targetProductId = mapProduct[ProductId]
    const skuContext = await sourceCatalog.getSkuContext(Id, importImages)
    const { Ean, specifications, files } = skuContext

    const payload = {
      ...sku,
      Id: newId,
      ProductId: targetProductId,
      IsActive: false,
      ActivateIfPossible: IsActive,
    }

    const { Id: targetId } = await targetCatalog.createSku(payload)

    await Promise.all([
      targetCatalog.associateSkuSpecifications(targetId, specifications),
      targetCatalog.createSkuEan(targetId, Ean ?? RefId),
      targetCatalog.createSkuFiles(targetId, files),
    ])

    await importEntity
      .save({
        executionImportId,
        name: entity,
        sourceAccount,
        sourceId: Id,
        targetId,
        payload,
        title: sku.Name,
      })
      .catch(() => incrementVBaseEntity(context))

    mapSku[Id] = targetId
    mapSourceSkuProduct[Id] = ProductId
  })

  context.state.mapSku = mapSku
  context.state.mapSourceSkuProduct = mapSourceSkuProduct
}

export default handleSkus
