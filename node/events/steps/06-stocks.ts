import { setCurrentImportId } from '..'
import {
  batch,
  FileManager,
  getEntityBySourceId,
  IMPORT_STATUS,
  incrementVBaseEntity,
  promiseWithConditionalRetry,
  updateCurrentImport,
} from '../../helpers'

const handleStocks = async (context: AppEventContext) => {
  const { importEntity, sourceCatalog, targetCatalog } = context.clients
  const {
    id: executionImportId,
    settings = {},
    stocksOption = 'KEEP_SOURCE',
    stockValue,
    targetWarehouse,
  } = context.state.body

  const {
    entity,
    // skuIds /* , mapSku */,
    // mapSourceSkuSellerStock,
  } = context.state

  const { account: sourceAccount } = settings

  const skuIdsFile = new FileManager(`skuIds-${executionImportId}`)

  if (
    !targetWarehouse ||
    !skuIdsFile.exists()
    // !skuIds?.length // ||
    // !mapSku ||
    // !mapSourceSkuSellerStock
  ) {
    return
  }

  const skuFile = new FileManager(`skus-${executionImportId}`)
  const sourceSkuSellerStockFile = new FileManager(
    `sourceSkuSellerStock-${executionImportId}`
  )

  if (!skuFile.exists() || !sourceSkuSellerStockFile.exists()) return

  const sourceStocks = await sourceCatalog.getInventories(
    skuIdsFile,
    // mapSourceSkuSellerStock
    sourceSkuSellerStockFile
  )

  const sourceStocksTotal = sourceStocks.length
  const mapStock: EntityMap = {}

  await updateCurrentImport(context, { sourceStocksTotal })
  await batch(sourceStocks, async (sourceStock) => {
    const { skuId, totalQuantity, hasUnlimitedQuantity, leadTime } = sourceStock
    const migrated = await getEntityBySourceId(context, skuId)

    if (migrated?.targetId) {
      mapStock[+skuId] = +migrated.targetId
    }

    if (mapStock[+skuId]) return

    const quantity =
      stocksOption === 'KEEP_SOURCE'
        ? totalQuantity
        : stocksOption === 'TO_BE_DEFINED'
        ? stockValue ?? 0
        : undefined

    const unlimitedQuantity =
      stocksOption === 'UNLIMITED' ||
      (hasUnlimitedQuantity && stocksOption === 'KEEP_SOURCE')

    const targetSku = +((await skuFile.findLine(skuId)) ?? 0) // mapSku[+skuId]
    const payload = { quantity, unlimitedQuantity, leadTime }

    await promiseWithConditionalRetry(
      () => targetCatalog.createInventory(targetSku, targetWarehouse, payload),
      null
    )

    await promiseWithConditionalRetry(
      () =>
        importEntity.save({
          executionImportId,
          name: entity,
          sourceAccount,
          sourceId: skuId,
          targetId: targetSku,
          payload,
          pathParams: { skus: targetSku, warehouses: targetWarehouse },
        }),
      null
    ).catch(() => incrementVBaseEntity(context))

    mapStock[+skuId] = targetSku
  })

  // context.state.mapSku = undefined
  // context.state.mapSourceSkuSellerStock = undefined

  await updateCurrentImport(context, {
    status: IMPORT_STATUS.SUCCESS,
    currentEntity: null,
  })

  setCurrentImportId(null)

  const categoryFile = new FileManager(`categories-${executionImportId}`)
  const productFile = new FileManager(`products-${executionImportId}`)
  const productDetailsFile = new FileManager(
    `productDetails-${executionImportId}`
  )

  const priceFile = new FileManager(`prices-${executionImportId}`)

  const sourceSkuProductFile = new FileManager(
    `sourceSkuProduct-${executionImportId}`
  )

  categoryFile.delete()
  productFile.delete()
  productDetailsFile.delete()
  sourceSkuProductFile.delete()
  priceFile.delete()
  skuFile.delete()
  skuIdsFile.delete()
  sourceSkuSellerStockFile.delete()
}

export default handleStocks
