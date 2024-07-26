import { method } from '@vtex/api'

const populateSource = async (context: Context) => {
  const { adminAuth, cosmos } = context.clients
  const user = await adminAuth.getUser().catch(() => {
    context.status = 401
    context.body = 'Not allowed'
  })

  if (!user) return
  const { gpc = '' } = context.query

  if (!gpc.trim()) {
    context.status = 400
    context.body = 'Provide a valid GPC at "gpc" query param'

    return
  }

  const products = await cosmos.getProductsByGpc(gpc)

  context.status = 200
  context.body = JSON.stringify(products, null, 2)
}

export default method({ GET: populateSource })
