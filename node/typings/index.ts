import type { EventContext, RecorderState, ServiceContext } from '@vtex/api'
import type { Brand as BrandFromClients } from '@vtex/clients'
import type { GraphQLField } from 'graphql'
import type { AppSettingsInput, Import } from 'ssesandbox04.catalog-importer'

import type { Clients } from '../clients'

declare global {
  type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

  type ID = string | number

  type User = { user: string }

  type WithInternalFields<T> = T & {
    id: string
    createdIn: string
    lastInteractionIn: string
    dataEntityId: string
  }

  type ServiceState = RecorderState & { settings?: AppSettingsInput }

  type Context = ServiceContext<Clients, ServiceState>

  type EventState = Omit<RecorderState, 'body'> & {
    body: Partial<WithInternalFields<Import>>
    entity?: string
  }

  type AppEventContext =
    | ServiceContext<Clients, EventState>
    | EventContext<Clients, EventState>

  type AppContext = Context | AppEventContext

  type CustomEventContext = EventContext<Clients, EventState>

  type WithSettingsArgs = {
    settings?: AppSettingsInput
    args?: { settings?: AppSettingsInput }
  }

  type WithSettingsField = GraphQLField<unknown, Context, WithSettingsArgs>

  type WithCustomSchemaField = GraphQLField<
    unknown,
    Context,
    Record<string, unknown>
  >

  type VBaseJSON = Record<string, number>

  type SaveEntityArgs = {
    targetId: ID
    payload: Record<string, unknown>
  }

  type Brand = BrandFromClients

  type BrandDetails = {
    Id: number
    Name: string
    Text: string
    Keywords: string
    SiteTitle: string
    Active: boolean
    MenuHome: boolean
    Score?: number
    LinkId?: string
  }

  type CategoryDetails = {
    Id: number
    Name: string
    FatherCategoryId?: number
    Title: string
    Description: string
    Keywords: string
    IsActive: boolean
    ShowInStoreFront: boolean
    ShowBrandFilter: boolean
    ActiveStoreFrontLink: boolean
    GlobalCategoryId?: number
    StockKeepingUnitSelectionMode: string
    Score?: number
    LinkId: string
    HasChildren: boolean
  }

  type ProductAndSkuIds = {
    data: Record<string, number[]>
    range: { total: number; from: number; to: number }
  }

  type ProductAndSkuResults = { products: number; skus: number }

  type ProductDetails = {
    newId?: number
    Id: number
    Name: string
    DepartmentId: number
    CategoryId: number
    BrandId: number
    LinkId: string
    RefId: string
    IsVisible: boolean
    Description: string
    DescriptionShort: string
    ReleaseDate: string
    KeyWords: string
    Title: string
    IsActive: boolean
    TaxCode: string
    MetaTagDescription: string
    ShowWithoutStock: boolean
    Score: number
  }

  type ProductPayload = ProductDetails & {
    CategoryPath: string
    BrandName: string
  }

  type SkuDetails = {
    newId?: number
    Id: number
    ProductId: number
    IsActive: boolean
    ActivateIfPossible: boolean
    Name: string
    RefId: string
    PackagedHeight: number
    PackagedLength: number
    PackagedWidth: number
    PackagedWeightKg: number
    Height: number
    Length: number
    Width: number
    WeightKg: number
    CubicWeight: number
    IsKit: boolean
    CreationDate: string
    RewardValue: number
    EstimatedDateArrival?: string
    ManufacturerCode: string
    CommercialConditionId: number
    MeasurementUnit: string
    UnitMultiplier: number
    ModalType?: string
    KitItensSellApart: boolean
    Videos: string[]
  }

  type ProductSpecification = {
    Id: number
    Name: string
    Value: string[]
  }

  type SkuSpecification = {
    FieldName: string
    FieldValues: string[]
    FieldGroupName: string
  }

  type SkuImage = {
    ImageUrl: string
    FileId: number
  }

  type SkuContext = {
    SkuSpecifications: SkuSpecification[]
    Images: SkuImage[]
    AlternateIds: {
      Ean?: string
    }
  }

  type SkuFileDetails = {
    Id: number
    ArchiveId: number
    SkuId: number
    Name: string
    IsMain: boolean
    Text: string
    Label: string
    Url: string
    FileLocation: string
  }

  type Specification = {
    Id: number
    FieldId: number
    FieldGroupId: number
    Name: string
    GroupName: string
    GroupPosition: number
  }

  type SpecificationGroup = {
    Id?: number
    Name: string
    Position: number
  }

  type AssociatedSpecification = {
    FieldName: string
    GroupName: string
    RootLevelSpecification: boolean
    FieldValues: string[]
  }

  type ProductSpecificationPayload = Omit<Specification, 'FieldGroupId'> &
    Omit<ProductSpecification, 'Id'>

  type FixedPrices = {
    tradePolicyId: number
    value: number
    listPrice?: number
    minQuantity: number
    dateRange?: {
      from: string
      to: string
    }
  }

  type PriceDetails = {
    itemId: string
    listPrice?: number
    costPrice: number
    markup: number
    basePrice: number
    fixedPrices: FixedPrices[]
    sellerStock?: number
  }

  type SalesChannelOffer = {
    price: number
    listPrice: number
    availableQuantity: number
  }

  type SkuOffer = {
    sellersOffers?: Array<{ salesChannelOffer: SalesChannelOffer[] }>
  }

  type SkuInventory = {
    skuId: string
    totalQuantity: number
    reservedQuantity: number
    hasUnlimitedQuantity: boolean
    timeToRefill?: string
    dateOfSupplyUtc?: string
    leadTime?: string
  }

  type SkuInventoryBySku = {
    skuId: string
    balance: SkuInventory[]
  }

  type SkuInventoryPayload = {
    quantity: number
    unlimitedQuantity: boolean
    dateUtcOnBalanceSystem?: string
    leadTime?: string
  }
}

export {}
