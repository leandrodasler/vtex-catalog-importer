import type { MutationExecuteImportArgs } from 'ssesandbox04.catalog-importer'

export const executeImport = async (
  _: unknown,
  { args }: MutationExecuteImportArgs,
  context: Context
) => {
  const importId = await context.clients.importExecution
    .save({
      ...args,
      categoryTree: JSON.stringify(args.categoryTree),
    })
    .then((response) => response.DocumentId)

  context.clients.events.sendEvent('', 'runImport', { args, importId })

  return importId
}
