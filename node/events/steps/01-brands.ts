import { batch, ENTITY_CONCURRENCY, updateCurrentImport } from '../../helpers'

const handleBrands = async (context: AppEventContext) => {
  const { sourceCatalog, targetCatalog, importEntity } = context.clients
  const { id: executionImportId, settings = {} } = context.state.body
  const { entity: name } = context.state
  const { account: sourceAccount } = settings
  const sourceBrands = await sourceCatalog.getSourceBrands()

  await updateCurrentImport(context, { sourceBrandsTotal: sourceBrands.length })
  await batch(
    sourceBrands,
    async (brand) => {
      const payload = { ...brand, Id: undefined }
      const { Id: sourceId } = brand
      const { Id: targetId } = await targetCatalog.createBrand(payload)

      await importEntity.save({
        executionImportId,
        name,
        sourceAccount,
        sourceId,
        targetId,
        payload,
      })
    },
    ENTITY_CONCURRENCY
  )
}

export default handleBrands
