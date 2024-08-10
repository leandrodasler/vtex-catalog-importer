export const targetWarehouses = async (
  _: unknown,
  __: unknown,
  context: Context
) => context.clients.targetCatalog.getWarehouses()
