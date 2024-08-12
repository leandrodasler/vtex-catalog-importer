import { sequentialBatch, updateCurrentImport } from '../../helpers'

const handleBrands = async (context: AppEventContext) => {
  const { sourceCatalog, targetCatalog, importEntity } = context.clients
  const { id: executionImportId, settings = {} } = context.state.body
  const { entity } = context.state
  const { account: sourceAccount } = settings
  const sourceBrands = await sourceCatalog.getBrands()

  await updateCurrentImport(context, { sourceBrandsTotal: sourceBrands.length })
  const mapBrand: EntityMap = {}

  await sequentialBatch(sourceBrands, async ({ Id, ...brand }) => {
    const payload = { ...brand }
    const { Id: targetId } = await targetCatalog.createBrand(payload)

    await importEntity.save({
      executionImportId,
      name: entity,
      sourceAccount,
      sourceId: Id,
      targetId,
      payload,
    })

    mapBrand[Id] = targetId
  })

  context.state.mapBrand = mapBrand
}

export default handleBrands
