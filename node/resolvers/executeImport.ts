import type { MutationExecuteImportArgs } from 'ssesandbox04.catalog-importer'

export const executeImport = async (
  _: unknown,
  { args }: MutationExecuteImportArgs,
  context: Context
) => {
  const { user } = await context.clients.vtexId.getUser()
  const { useDefault } = args.settings
  const settings = useDefault ? { useDefault } : args.settings

  const importId = await context.clients.importExecution
    .save({ ...args, user, settings })
    .then((response) => response.DocumentId)

  context.clients.events.sendEvent('', 'runImport', {
    user,
    settings: context.state.body.settings,
    importId,
  })

  return importId
}
