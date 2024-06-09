import type { Maybe } from '@vtex/api'
import type { Brand } from '@vtex/clients'

type CreateBrandBody = {
  Id?: string
  Name: string
  Text?: Maybe<string>
  Active: boolean
  LinkId?: Maybe<string>
}

const mapper = (brand: Brand) => ({
  Id: brand.id,
  Name: brand.name,
  Text: brand.title,
  Active: brand.isActive,
})

export const brands = async (_: unknown, __: unknown, context: Context) => {
  const brandsList = await context.clients.httpClient.get<Maybe<Brand[]>>(
    'api/catalog_system/pvt/brand/list'
  )

  if (!brandsList?.length) {
    throw new Error('admin/brands.missing.error')
  }

  const newBrands = await Promise.all(
    brandsList
      ?.map(mapper)
      .map(async (brand) =>
        context.clients.httpClient.post<CreateBrandBody>(
          'api/catalog/pvt/brand',
          brand
        )
      )
  )

  return newBrands
}
