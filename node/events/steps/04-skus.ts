import {
  batch,
  FileManager,
  getEntityBySourceId,
  incrementVBaseEntity,
  promiseWithConditionalRetry,
} from '../../helpers'

const handleSkus = async (context: AppEventContext) => {
  const { entity } = context.state
  const { sourceCatalog, targetCatalog, importEntity } = context.clients
  const {
    id: executionImportId,
    settings = {},
    importImages = true,
  } = context.state.body

  const productFile = new FileManager(`products-${executionImportId}`)
  const skuIdsFile = new FileManager(`skuIds-${executionImportId}`)

  if (!productFile.exists() || !skuIdsFile.exists()) return

  const { account: sourceAccount } = settings
  const [firstSku, ...sourceSkus] = await sourceCatalog.getSkus(skuIdsFile)

  const skuFile = new FileManager(`skus-${executionImportId}`)
  const skuFileWriteStream = skuFile.getWriteStream()

  const sourceSkuProductFile = new FileManager(
    `sourceSkuProduct-${executionImportId}`
  )

  const sourceSkuProductFileWriteStream = sourceSkuProductFile.getWriteStream()

  const processSku = async ({ Id, newId, RefId, ...sku }: SkuDetails) => {
    const migrated = await getEntityBySourceId(context, Id)

    if (migrated?.targetId) {
      skuFileWriteStream.write(`${Id}=>${migrated.targetId}\n`)
    }

    const currentProcessed = await skuFile.findLine(Id)

    if (currentProcessed) return +currentProcessed

    const { ProductId, IsActive } = sku
    const targetProductId = +((await productFile.findLine(ProductId)) ?? 0)
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

    skuFileWriteStream.write(`${Id}=>${targetId}\n`)
    sourceSkuProductFileWriteStream.write(`${Id}=>${ProductId}\n`)

    return targetId
  }

  const lastSkuId = await processSku(firstSku)

  const skusWithIds = sourceSkus.map((data, index) => ({
    ...data,
    newId: lastSkuId + index + 1,
  }))

  await batch(skusWithIds, processSku)

  skuFileWriteStream.end()
  sourceSkuProductFileWriteStream.end()
}

export default handleSkus
