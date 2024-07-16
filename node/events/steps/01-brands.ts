import type { Brand } from '@vtex/clients'

import { ENDPOINTS, batch, brandMapper, updateImport } from '../../helpers'

const handleBrands = async (context: AppEventContext) => {
  const { httpClient, importEntity } = context.clients
  const { id = '', settings = {} } = context.state.body
  const brands = await httpClient.get<Brand[]>(ENDPOINTS.brands.get)

  await updateImport(context, { sourceBrandsTotal: brands.length })

  await batch(brands.map(brandMapper), (brand) =>
    importEntity.save({
      executionImportId: id,
      name: context.state.entity,
      sourceAccount: settings.account ?? '',
      sourceId: String(brand.Id),
      payload: { ...brand, Id: undefined },
    })
  )
}

export default handleBrands
