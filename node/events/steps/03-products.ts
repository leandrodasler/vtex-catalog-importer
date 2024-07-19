import { delay, updateCurrentImport } from '../../helpers'

const handleProducts = async (context: AppEventContext) => {
  // TODO: process products import
  const { importEntity } = context.clients
  const { id = '', settings = {} } = context.state.body

  await updateCurrentImport(context, { sourceProductsTotal: 5 })

  await delay(1000)
  await importEntity.save({
    executionImportId: id,
    name: context.state.entity,
    sourceAccount: settings.account ?? '',
    sourceId: '1',
    payload: { name: `${context.state.entity} 1` },
  })

  await delay(1000)
  await importEntity.save({
    executionImportId: id,
    name: context.state.entity,
    sourceAccount: settings.account ?? '',
    sourceId: '2',
    payload: { name: `${context.state.entity} 2` },
  })

  await delay(1000)
  await importEntity.save({
    executionImportId: id,
    name: context.state.entity,
    sourceAccount: settings.account ?? '',
    sourceId: '3',
    payload: { name: `${context.state.entity} 3` },
  })

  await delay(1000)
  await importEntity.save({
    executionImportId: id,
    name: context.state.entity,
    sourceAccount: settings.account ?? '',
    sourceId: '4',
    payload: { name: `${context.state.entity} 4` },
  })

  await delay(1000)
  await importEntity.save({
    executionImportId: id,
    name: context.state.entity,
    sourceAccount: settings.account ?? '',
    sourceId: '5',
    payload: { name: `${context.state.entity} 5` },
  })
}

export default handleProducts
