import { entityGetAll } from '../../helpers'

export const clearImports = async (
  _: unknown,
  __: unknown,
  context: Context
): Promise<number> => {
  const { importExecution } = context.clients
  const allImportIds = await entityGetAll(importExecution, ['id'])

  await Promise.all(allImportIds.map((data) => importExecution.delete(data.id)))

  return allImportIds.length
}
