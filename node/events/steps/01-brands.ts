import {
  getEntityBySourceId,
  getEntityByTitle,
  incrementVBaseEntity,
  sequentialBatch,
  updateCurrentImport,
} from '../../helpers'

const handleBrands = async (context: AppEventContext) => {
  const { sourceCatalog, targetCatalog, importEntity } = context.clients
  const { id: executionImportId, settings = {} } = context.state.body
  const { entity } = context.state
  const { account: sourceAccount } = settings
  const sourceBrands = await sourceCatalog.getBrands()
  const targetBrands = await targetCatalog.getBrands()

  await updateCurrentImport(context, { sourceBrandsTotal: sourceBrands.length })
  const mapBrand: EntityMap = {}
  const mapBrandName: EntityMapName = {}

  await sequentialBatch(sourceBrands, async ({ Id, ...brand }) => {
    const migrated = await getEntityBySourceId(context, Id)

    if (migrated?.targetId) {
      mapBrand[Id] = +migrated.targetId
    }

    if (mapBrand[Id]) {
      return
    }

    const existingBrand =
      mapBrandName[brand.Name] ??
      targetBrands.find(
        (b) => b.name.toLowerCase() === brand.Name.toLowerCase()
      ) ??
      (await getEntityByTitle(context, brand.Name))

    const payloadNew = { ...brand }

    const { Id: targetId } = existingBrand
      ? { Id: +existingBrand.id }
      : await targetCatalog.createBrand(payloadNew)

    const payload = existingBrand ? { ...existingBrand } : payloadNew

    await importEntity
      .save({
        executionImportId,
        name: entity,
        sourceAccount,
        sourceId: Id,
        targetId,
        payload,
        title: brand.Name,
        pathParams: existingBrand ? { brand: targetId } : null,
      })
      .catch(() => incrementVBaseEntity(context))

    mapBrand[Id] = targetId
    mapBrandName[brand.Name] = { id: targetId }
  })

  context.state.mapBrand = mapBrand
}

export default handleBrands
