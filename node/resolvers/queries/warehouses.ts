export const warehouses = async (_: unknown, __: unknown, context: Context) => {
  const [source, target] = await Promise.all([
    context.clients.sourceCatalog.getWarehouses(),
    context.clients.targetCatalog.getWarehouses(),
  ])

  return { source, target }
}
