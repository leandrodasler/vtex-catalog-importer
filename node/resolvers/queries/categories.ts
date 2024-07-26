export const categories = async (_: unknown, __: unknown, context: Context) =>
  context.clients.sourceCatalog.getCategoryTree()
