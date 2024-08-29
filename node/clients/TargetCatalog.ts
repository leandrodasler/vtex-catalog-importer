import type { InstanceOptions } from '@vtex/api'

import {
  batch,
  delay,
  ENDPOINTS,
  PRODUCT_LINK_ID_ERROR,
  PRODUCT_REF_ID_ERROR,
  sequentialBatch,
} from '../helpers'
import HttpClient from './HttpClient'

export default class TargetCatalog extends HttpClient {
  protected getRequestConfig(): InstanceOptions {
    const VtexIdclientAutcookie = this.context.adminUserAuthToken as string
    const headers = {
      ...this.options?.headers,
      VtexIdclientAutcookie,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }

    return { ...this.options, headers }
  }

  protected getUrl(path: string) {
    return `http://${this.context.account}.${ENDPOINTS.host}${path}`
  }

  public async getBrands() {
    return (await this.get<Brand[]>(ENDPOINTS.brand.list)).filter(
      (b) => b.isActive
    )
  }

  public async createBrand<T extends BrandDetails>(payload: Partial<T>) {
    return this.post<T, Partial<T>>(ENDPOINTS.brand.set, payload)
  }

  public async createCategory<T extends CategoryDetails>(payload: Partial<T>) {
    return this.post<T, Partial<T>>(ENDPOINTS.category.set, payload)
  }

  private async createUniqueProduct<T extends ProductDetails>(
    payload: Partial<T>,
    countRefId = 0,
    countLinkId = 0
  ): Promise<T> {
    const { RefId, LinkId } = payload
    const newRefId = RefId && countRefId ? `${RefId}-${countRefId}` : RefId
    const newLinkId =
      LinkId && countLinkId ? `${LinkId}-${countLinkId}` : LinkId

    const newPayload = { ...payload, RefId: newRefId, LinkId: newLinkId }

    return this.post<T, Partial<T>>(ENDPOINTS.product.set, newPayload).catch(
      (e) => {
        const refIdError = e.response?.data?.includes?.(PRODUCT_REF_ID_ERROR)
        const linkIdError = e.response?.data?.includes?.(PRODUCT_LINK_ID_ERROR)

        if (refIdError) {
          return this.createUniqueProduct(payload, countRefId + 1, countLinkId)
        }

        if (linkIdError) {
          return this.createUniqueProduct(payload, countRefId, countLinkId + 1)
        }

        throw e
      }
    )
  }

  public async createProduct<T extends ProductPayload>(payload: Partial<T>) {
    return this.createUniqueProduct(payload)
  }

  public async updateProduct<T extends ProductPayload>(
    id: ID,
    payload: Partial<T>
  ) {
    return this.put<T, Partial<T>>(
      ENDPOINTS.product.updateOrDetails(id),
      payload
    )
  }

  public async createSku<T extends SkuDetails>(payload: Partial<T>) {
    return this.post<T, Partial<T>>(ENDPOINTS.sku.set, payload)
  }

  private async associateProductSpecification(
    productId: ID,
    payload: AssociatedSpecification
  ) {
    return this.put(ENDPOINTS.product.setSpecification(productId), payload)
  }

  public async associateProductSpecifications(
    productId: ID,
    specifications: ProductSpecificationPayload[]
  ) {
    return sequentialBatch(
      specifications,
      async ({ Name: FieldName, Value: FieldValues, GroupName }) => {
        await this.associateProductSpecification(productId, {
          FieldName,
          FieldValues,
          GroupName,
          RootLevelSpecification: false,
        })
      }
    )
  }

  private async associateSkuSpecification(
    skuId: ID,
    payload: AssociatedSpecification
  ) {
    return this.put(ENDPOINTS.sku.setSpecification(skuId), payload)
  }

  public async associateSkuSpecifications(
    skuId: ID,
    specifications: SkuSpecification[]
  ) {
    return batch(
      specifications,
      async ({ FieldName, FieldValues, FieldGroupName: GroupName }) => {
        await this.associateSkuSpecification(skuId, {
          FieldName,
          FieldValues,
          GroupName,
          RootLevelSpecification: false,
        })
      }
    )
  }

  public async createSkuEan(skuId: ID, ean?: string) {
    if (!ean) return

    return this.post(ENDPOINTS.sku.setEan(skuId, ean))
  }

  public async createSkuFiles<T extends SkuFileDetails>(
    skuId: ID,
    payload: Array<Partial<T>>
  ) {
    return (
      payload.length &&
      sequentialBatch(payload, (file) =>
        this.post<T, Partial<T>>(ENDPOINTS.sku.listOrSetFile(skuId), file)
      )
    )
  }

  public async createPrice<T extends PriceDetails>(
    skuId: ID,
    payload: Partial<T>
  ) {
    return this.put<never, Partial<T>>(ENDPOINTS.price.getOrset(skuId), payload)
  }

  public async createInventory<T extends SkuInventoryPayload>(
    skuId: ID,
    warehouseId: ID,
    payload: Partial<T>
  ) {
    return this.put<never, Partial<T>>(
      ENDPOINTS.stock.set(skuId, warehouseId),
      payload
    )
  }

  public async getProductAndSkuIds(initial = 1, max?: number) {
    const maxPerPage = 250
    let result: ProductAndSkuIds['data'] = {}
    let from = initial
    let to = max ? Math.min(initial + maxPerPage - 1, max) : maxPerPage

    const getRange = async () => {
      const { data, range } = await this.get<ProductAndSkuIds>(
        ENDPOINTS.product.listAll(from, to)
      )

      result = { ...result, ...data }

      if (range.total <= to || (max && from >= max)) {
        return
      }

      from += maxPerPage
      to = max ? Math.min(from + maxPerPage - 1, max) : from + maxPerPage - 1
      await delay(500)
      await getRange()
    }

    await getRange()

    return result
  }

  private async deleteCategory(id: ID) {
    return this.put<CategoryDetails, Partial<CategoryDetails>>(
      ENDPOINTS.category.updateOrDetails(id),
      { Name: 'DELETED' }
    ).catch(() => {})
  }

  private async deleteProduct(id: ID) {
    const newName = `DELETED-${id}-${Date.now()}`

    return this.get<ProductDetails>(ENDPOINTS.product.updateOrDetails(id))
      .then((product) =>
        this.put<ProductDetails, Partial<ProductDetails>>(
          ENDPOINTS.product.updateOrDetails(id),
          {
            ...product,
            Name: newName,
            LinkId: newName,
            RefId: newName,
            IsActive: false,
          }
        )
      )
      .catch(() => {})
  }

  private async deleteSku(id: ID) {
    const newName = `DELETED-${id}-${Date.now()}`

    return this.get<SkuDetails>(ENDPOINTS.sku.updateOrDetails(id))
      .then((sku) => {
        Promise.all([
          this.put<SkuDetails, Partial<SkuDetails>>(
            ENDPOINTS.sku.updateOrDetails(id),
            {
              ...sku,
              Name: newName,
              ActivateIfPossible: false,
              RefId: newName,
              IsActive: false,
            }
          ),

          this.delete(ENDPOINTS.sku.setEan(id)),
        ])
      })
      .catch(() => {})
  }

  public async deleteEntity(entity: string, id: ID) {
    if (!entity || !id) return null

    switch (entity) {
      case 'category':
        return this.deleteCategory(id)

      case 'product':
        return this.deleteProduct(id)

      case 'sku':
        return this.deleteSku(id)

      default:
        return null
    }
  }
}
