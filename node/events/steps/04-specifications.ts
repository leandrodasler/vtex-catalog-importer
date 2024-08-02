import { sequentialBatch, updateCurrentImport } from '../../helpers'

const handleSpecifications = async (context: AppEventContext) => {
  const { sourceCatalog, targetCatalog, importEntity } = context.clients
  const {
    id: executionImportId,
    settings = {},
    categoryTree,
  } = context.state.body

  const { entity, mapCategories, mapSpecificationGroups } = context.state
  const { account: sourceAccount } = settings

  if (!categoryTree || !mapCategories || !mapSpecificationGroups) return

  const sourceSpecifications = await sourceCatalog.getSpecifications(
    categoryTree
  )

  const sourceSpecificationsTotal = sourceSpecifications.length
  const mapSpecifications: EntityMap = {}

  await updateCurrentImport(context, { sourceSpecificationsTotal })
  await sequentialBatch(
    sourceSpecifications,
    async ({ Id, CategoryId, FieldGroupId, ...specification }) => {
      const payload = {
        ...specification,
        CategoryId: mapCategories[CategoryId],
        FieldGroupId: mapSpecificationGroups[FieldGroupId],
      }

      const { Id: targetId } = await targetCatalog.createSpecification(payload)

      await importEntity.save({
        executionImportId,
        name: entity,
        sourceAccount,
        sourceId: Id,
        targetId,
        payload,
      })

      mapSpecifications[Id] = targetId
    }
  )

  context.state.mapSpecifications = mapSpecifications
}

export default handleSpecifications
