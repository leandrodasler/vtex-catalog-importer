import { sequentialBatch, updateCurrentImport } from '../../helpers'

const handleSpecifications = async (context: AppEventContext) => {
  const { sourceCatalog /* , targetCatalog, importEntity */ } = context.clients
  const {
    // id: executionImportId,
    // settings = {},
    categoryTree,
  } = context.state.body

  // const { entity } = context.state
  // const { account: sourceAccount } = settings

  if (!categoryTree) return

  const sourceSpecificationGroups = await sourceCatalog.getSpecificationGroups(
    categoryTree
  )

  await updateCurrentImport(context, {
    sourceBrandsTotal: sourceSpecificationGroups.length,
  })

  await sequentialBatch(
    sourceSpecificationGroups,
    async ({ Id: sourceId, ...specificationGroup }) => {
      // eslint-disable-next-line no-console
      console.log('createSpecificationGroup', sourceId, specificationGroup)

      // TODO
    }
  )
}

export default handleSpecifications
