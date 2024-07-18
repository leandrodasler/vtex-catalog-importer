import type { MutationExecuteImportArgs } from 'ssesandbox04.catalog-importer'

import { IMPORT_STATUS, setCachedContext } from '../../helpers'

export const executeImport = async (
  _: unknown,
  { args }: MutationExecuteImportArgs,
  context: Context
) => {
  setCachedContext(context)
  const { user } = await context.clients.vtexId.getUser()
  const { useDefault } = args.settings
  const settings = useDefault ? { useDefault } : args.settings
  const status = args.status ?? IMPORT_STATUS.PENDING
  const entityPayload = { ...args, user, settings, status }

  const id = await context.clients.importExecution
    .save(entityPayload)
    .then((response) => response.DocumentId)

  return id
}
