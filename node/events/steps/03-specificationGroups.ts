import { sequentialBatch, updateCurrentImport } from '../../helpers'

const handleSpecificationGroups = async (context: AppEventContext) => {
  const { sourceCatalog, targetCatalog, importEntity } = context.clients
  const {
    id: executionImportId,
    settings = {},
    categoryTree,
  } = context.state.body

  const { entity, mapCategories } = context.state
  const { account: sourceAccount } = settings

  if (!categoryTree || !mapCategories) return

  const sourceSpecificationGroups = await sourceCatalog.getSpecificationGroups(
    categoryTree
  )

  const sourceSpecificationGroupsTotal = sourceSpecificationGroups.length
  const mapSpecificationGroups: EntityMap = {}

  await updateCurrentImport(context, { sourceSpecificationGroupsTotal })
  await sequentialBatch(
    sourceSpecificationGroups,
    async ({ Id, CategoryId, ...specificationGroup }) => {
      const payload = {
        ...specificationGroup,
        CategoryId: mapCategories[CategoryId],
      }

      const { Id: targetId } = await targetCatalog.createSpecificationGroup(
        payload
      )

      await importEntity.save({
        executionImportId,
        name: entity,
        sourceAccount,
        sourceId: Id,
        targetId,
        payload,
      })

      mapSpecificationGroups[Id] = targetId
    }
  )

  context.state.mapSpecificationGroups = mapSpecificationGroups
}

export default handleSpecificationGroups
