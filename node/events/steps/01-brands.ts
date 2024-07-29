import { sequentialBatch, updateCurrentImport } from '../../helpers'

const handleBrands = async (context: AppEventContext) => {
  const { sourceCatalog, targetCatalog, importEntity } = context.clients
  const { id: executionImportId, settings = {} } = context.state.body
  const { entity } = context.state
  const { account: sourceAccount } = settings
  const sourceBrands = await sourceCatalog.getBrands()

  await updateCurrentImport(context, { sourceBrandsTotal: sourceBrands.length })
  await sequentialBatch(sourceBrands, async (brand) => {
    const payload = { ...brand, Id: undefined }
    const { Id: sourceId } = brand
    const { Id: targetId } = await targetCatalog.createBrand(payload)

    await importEntity.save({
      executionImportId,
      name: entity,
      sourceAccount,
      sourceId,
      targetId,
      payload,
    })
  })
}

export default handleBrands
