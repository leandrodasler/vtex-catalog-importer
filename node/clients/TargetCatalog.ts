import type { InstanceOptions } from '@vtex/api'

import { batch, delay, ENDPOINTS, sequentialBatch } from '../helpers'
import HttpClient from './HttpClient'

export default class TargetCatalog extends HttpClient {
  protected getRequestConfig(): InstanceOptions {
    const { adminUserAuthToken, authToken } = this.context
    const VtexIdclientAutcookie = (adminUserAuthToken ?? authToken) as string
    const headers = { ...this.options?.headers, VtexIdclientAutcookie }

    return { ...this.options, headers }
  }

  protected getUrl(path: string) {
    return `http://${this.context.account}.${ENDPOINTS.host}${path}`
  }

  public async createBrand<T extends BrandDetails>(payload: Partial<T>) {
    return this.post<T, Partial<T>>(ENDPOINTS.brand.set, payload)
  }

  public async createCategory<T extends CategoryDetails>(payload: Partial<T>) {
    return this.post<T, Partial<T>>(ENDPOINTS.category.set, payload)
  }

  public async createProduct<T extends ProductDetails>(payload: Partial<T>) {
    return this.post<T, Partial<T>>(ENDPOINTS.product.set, payload)
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

  public async getProductAndSkuIds(initial = 1) {
    const maxPerPage = 250
    let result: ProductAndSkuIds['data'] = {}
    let from = initial
    let to = maxPerPage

    const getRange = async () => {
      const { data, range } = await this.get<ProductAndSkuIds>(
        ENDPOINTS.product.listAll(from, to)
      )

      result = { ...result, ...data }
      if (range.total <= to) {
        return
      }

      from += maxPerPage
      to += maxPerPage
      await delay(500)
      await getRange()
    }

    await getRange()

    return result
  }

  private async deleteBrand(id: ID) {
    return this.delete(ENDPOINTS.brand.updateOrDetails(id))
      .catch(() => {
        const newName = `DELETED-${id}-${Date.now()}`

        return this.put<BrandDetails, Partial<BrandDetails>>(
          ENDPOINTS.brand.updateOrDetails(id),
          {
            Name: newName,
            LinkId: newName,
            Active: false,
          }
        )
      })
      .catch(() => {})
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
      case 'brand':
        return this.deleteBrand(id)

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
