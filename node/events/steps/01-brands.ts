/* eslint-disable no-console */
import type { Maybe } from '@vtex/api'
import type { Brand } from '@vtex/clients'

import { ENDPOINTS, batch, brandMapper } from '../../helpers'

export const brands = async (context: AppEventContext) => {
  console.log('========================')
  console.log('"brands" import step')
  console.log(context.state.body)

  context.state.step = 'brands'
  const { httpClient, importEntity, importExecution } = context.clients
  const { id = '', settings = {} } = context.state.body

  const brandsData = await httpClient.get<Maybe<Brand[]>>(ENDPOINTS.brands.get)

  if (!brandsData?.length) {
    return
  }

  console.log('Total brands to be imported:', brandsData.length)

  await importExecution.update(id, { sourceBrandsTotal: brandsData.length })

  await batch(brandsData.map(brandMapper), (brand) =>
    importEntity.save({
      executionImportId: id,
      name: 'brand',
      sourceAccount: settings.account ?? '',
      sourceId: String(brand.Id),
      payload: { ...brand, Id: undefined },
    })
  )
}
