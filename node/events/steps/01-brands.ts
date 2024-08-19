import {
  getTargetEntityByName,
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

  await sequentialBatch(sourceBrands, async ({ Id, ...brand }) => {
    const existingBrand =
      targetBrands.find(
        (b) => b.name.toLowerCase() === brand.Name.toLowerCase()
      ) ?? (await getTargetEntityByName(context, brand.Name))

    const payload = { ...brand }

    const { Id: targetId } = existingBrand
      ? { Id: +existingBrand.id }
      : await targetCatalog.createBrand(payload)

    await importEntity.save({
      executionImportId,
      name: entity,
      sourceAccount,
      sourceId: Id,
      targetId,
      payload: existingBrand ? { ...existingBrand } : payload,
      title: brand.Name,
      pathParams: existingBrand ? { brand: targetId } : null,
    })

    mapBrand[Id] = targetId
  })

  context.state.mapBrand = mapBrand
}

export default handleBrands
