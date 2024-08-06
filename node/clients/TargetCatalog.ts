import type { InstanceOptions } from '@vtex/api'

import { batch, ENDPOINTS, sequentialBatch } from '../helpers'
import HttpClient from './HttpClient'

export default class TargetCatalog extends HttpClient {
  protected getRequestConfig(): InstanceOptions {
    return {
      ...this.options,
      headers: {
        ...this.options?.headers,
        VtexIdclientAutcookie: this.context.authToken ?? '',
      },
    }
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

  public async createSkuEan(id: ID, ean?: string) {
    if (!ean) return

    return this.post(ENDPOINTS.sku.setEan(id, ean))
  }

  public async createSkuFiles<T extends SkuFileDetails>(
    id: ID,
    payload: Array<Partial<T>>
  ) {
    return (
      payload.length &&
      batch(payload, (file) =>
        this.post<T, Partial<T>>(ENDPOINTS.sku.listOrSetFile(id), file)
      )
    )
  }

  /* remove this after */
  public async getProductIds(initial = 1) {
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
      await getRange()
    }

    await getRange()
    const productIds = Object.keys(result)
    const skuIds = Object.values(result).flat()

    return { productIds, skuIds }
  }

  /* remove this after */
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

  /* remove this after */
  private async deleteCategory(id: ID) {
    return this.put<CategoryDetails, Partial<CategoryDetails>>(
      ENDPOINTS.category.updateOrDetails(id),
      { Name: 'DELETED' }
    ).catch(() => {})
  }

  /* remove this after */
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

  /* remove this after */
  private async deleteSku(id: ID) {
    const newName = `DELETED-${id}-${Date.now()}`

    return this.get<SkuDetails>(ENDPOINTS.sku.updateOrDetails(id))
      .then((sku) => {
        this.put<SkuDetails, Partial<SkuDetails>>(
          ENDPOINTS.sku.updateOrDetails(id),
          {
            ...sku,
            Name: newName,
            ActivateIfPossible: false,
            RefId: newName,
            IsActive: false,
          }
        )

        if (sku.Ean) {
          this.delete(ENDPOINTS.sku.setEan(id, sku.Ean))
        }
      })
      .catch(() => {})
  }

  /* remove this after */
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
