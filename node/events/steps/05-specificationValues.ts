import { sequentialBatch, updateCurrentImport } from '../../helpers'

const handleSpecificationValues = async (context: AppEventContext) => {
  const { sourceCatalog, targetCatalog, importEntity } = context.clients
  const { id: executionImportId, settings = {} } = context.state.body

  const { entity, mapSpecifications } = context.state
  const { account: sourceAccount } = settings

  if (!mapSpecifications) return

  const sourceSpecificationValues = await sourceCatalog.getSpecificationValues(
    Object.keys(mapSpecifications).map(Number)
  )

  const sourceSpecificationValuesTotal = sourceSpecificationValues.length
  const mapSpecificationValues: EntityMap = {}

  await updateCurrentImport(context, { sourceSpecificationValuesTotal })
  await sequentialBatch(
    sourceSpecificationValues,
    async ({ FieldValueId, FieldId, ...specificationValue }) => {
      const payload = {
        ...specificationValue,
        FieldId: mapSpecifications[FieldId],
      }

      const {
        FieldValueId: targetId,
      } = await targetCatalog.createSpecificationValue(payload)

      await importEntity.save({
        executionImportId,
        name: entity,
        sourceAccount,
        sourceId: FieldValueId,
        targetId,
        payload,
      })

      mapSpecificationValues[FieldValueId] = targetId
    }
  )

  context.state.mapSpecificationValues = mapSpecificationValues
}

export default handleSpecificationValues
