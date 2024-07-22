import { batch, getExistingTargetId, updateCurrentImport } from '../../helpers'

const handleBrands = async (context: AppEventContext) => {
  const { httpClient, catalog, importEntity } = context.clients
  const { id, settings = {} } = context.state.body
  const { entity } = context.state
  const { account: sourceAccount } = settings
  const brands = await httpClient.getSourceBrands()

  await updateCurrentImport(context, { sourceBrandsTotal: brands.length })
  await batch(
    brands,
    async (brand) => {
      const sourceId = brand.Id
      const payload = { ...brand, Id: undefined }
      const existingTargetId = await getExistingTargetId(context, sourceId)
      const saveInCatalogPromise = existingTargetId
        ? catalog.updateBrand(payload, existingTargetId)
        : catalog.createBrand(payload)

      return saveInCatalogPromise.then(({ Id: targetId }) => {
        importEntity.save({
          executionImportId: id,
          name: entity,
          sourceAccount,
          sourceId,
          targetId,
          payload,
          pathParams: existingTargetId,
        })
      })
    },
    1
  )
}

export default handleBrands
