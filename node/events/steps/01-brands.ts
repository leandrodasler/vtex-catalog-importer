import { batch, BRAND_CONCURRENCY, updateCurrentImport } from '../../helpers'

const handleBrands = async (context: AppEventContext) => {
  const { httpClient, catalog, importEntity } = context.clients
  const { id: executionImportId, settings = {} } = context.state.body
  const { entity: name } = context.state
  const { account: sourceAccount } = settings
  const brands = await httpClient.getSourceBrands()

  await updateCurrentImport(context, { sourceBrandsTotal: brands.length })
  await batch(
    brands,
    async (brand) => {
      const sourceId = brand.Id
      const payload = { ...brand, Id: undefined }
      const { Id: targetId } = await catalog.createBrand(payload)

      await importEntity.save({
        executionImportId,
        name,
        sourceAccount,
        sourceId,
        targetId,
        payload,
      })
    },
    BRAND_CONCURRENCY
  )
}

export default handleBrands
