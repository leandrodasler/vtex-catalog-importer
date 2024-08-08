export const warehouses = async (_: unknown, __: unknown, context: Context) => {
  const [target, source] = await Promise.all([
    context.clients.privateClient.getWarehouses(),
    context.clients.sourceCatalog.getWarehouses(),
  ])

  return { target, source }
}
