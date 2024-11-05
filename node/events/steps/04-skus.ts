import {
  batch,
  getEntityBySourceId,
  incrementVBaseEntity,
  promiseWithConditionalRetry,
} from '../../helpers'

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
  const [firstSku, ...sourceSkus] = await sourceCatalog.getSkus(skuIds)

  const mapSku: EntityMap = {}
  const mapSourceSkuProduct: EntityMap = {}

  const processSku = async ({ Id, newId, RefId, ...sku }: SkuDetails) => {
    const migrated = await getEntityBySourceId(context, Id)

    if (migrated?.targetId) {
      mapSku[Id] = +migrated.targetId
    }

    if (mapSku[Id]) return mapSku[Id]

    const { ProductId, IsActive } = sku
    const targetProductId = mapProduct[ProductId]
    const skuContext = await sourceCatalog.getSkuContext(Id, importImages)
    const { Ean, specifications, files } = skuContext

    const payload = {
      ...sku,
      ...(newId && { Id: newId }),
      ProductId: targetProductId,
      IsActive: false,
      ActivateIfPossible: IsActive,
    }

    const { Id: targetId } = await promiseWithConditionalRetry(
      () => targetCatalog.createSku(payload),
      null
    )

    await Promise.all([
      promiseWithConditionalRetry(
        () =>
          targetCatalog.associateSkuSpecifications(targetId, specifications),
        null
      ),
      promiseWithConditionalRetry(
        () => targetCatalog.createSkuEan(targetId, Ean ?? RefId),
        null
      ),
      promiseWithConditionalRetry(
        () => targetCatalog.createSkuFiles(targetId, files),
        null
      ),
    ])

    await promiseWithConditionalRetry(
      () =>
        importEntity.save({
          executionImportId,
          name: entity,
          sourceAccount,
          sourceId: Id,
          targetId,
          payload,
          title: sku.Name,
        }),
      null
    ).catch(() => incrementVBaseEntity(context))

    mapSku[Id] = targetId
    mapSourceSkuProduct[Id] = ProductId

    return targetId
  }

  const lastSkuId = await processSku(firstSku)

  const skusWithIds = sourceSkus.map((data, index) => ({
    ...data,
    newId: lastSkuId + index + 1,
  }))

  await batch(skusWithIds, processSku)

  context.state.mapSku = mapSku
  context.state.mapSourceSkuProduct = mapSourceSkuProduct
  context.state.mapProduct = undefined
}

export default handleSkus
