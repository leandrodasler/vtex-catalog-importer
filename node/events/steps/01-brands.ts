/* eslint-disable no-console */
import type { Brand } from '@vtex/clients'

import { printStep } from '..'
import { ENDPOINTS, batch, brandMapper, updateImport } from '../../helpers'

const handleBrands = async (context: AppEventContext) => {
  context.state.step = 'brands'
  printStep(context)
  const { httpClient, importEntity } = context.clients
  const { id = '', settings = {} } = context.state.body
  const brands = await httpClient.get<Brand[]>(ENDPOINTS.brands.get)

  console.log('Total brands to be imported:', brands.length)

  await updateImport(context, { sourceBrandsTotal: brands.length })

  await batch(brands.map(brandMapper), (brand) =>
    importEntity.save({
      executionImportId: id,
      name: 'brand',
      sourceAccount: settings.account ?? '',
      sourceId: String(brand.Id),
      payload: { ...brand, Id: undefined },
    })
  )
}

export default handleBrands
