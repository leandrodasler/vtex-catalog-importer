/* eslint-disable no-console */
import type { Brand } from '@vtex/clients'

import {
  ENDPOINTS,
  batch,
  brandMapper,
  handleError,
  printImport,
  updateImport,
} from '../../helpers'

const handleBrands = async (context: AppEventContext) => {
  try {
    if (context.state.body.error) return

    context.state.step = 'brands'
    printImport(context)
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
  } catch (error) {
    await handleError(context, error)
  }
}

export default handleBrands
