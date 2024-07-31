import type { EventContext, RecorderState, ServiceContext } from '@vtex/api'
import type { Brand as BrandFromClients } from '@vtex/clients'
import type { GraphQLField } from 'graphql'
import type { AppSettingsInput, Import } from 'ssesandbox04.catalog-importer'

import type { Clients } from '../clients'

declare global {
  type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  type User = { user: string }
  type WithInternalFields<T> = T & {
    id: string
    createdIn: string
    lastInteractionIn: string
    dataEntityId: string
  }
  type ServiceState = RecorderState & { settings?: AppSettingsInput }
  type Context = ServiceContext<Clients, ServiceState>
  type EntityMap = Record<number, number>
  type EventState = {
    body: Partial<WithInternalFields<Import>>
    entity?: string
    mapCategories?: EntityMap
    mapBrands?: EntityMap
    mapProducts?: EntityMap
    skuIds?: number[]
  }
  type AppEventContext = EventContext<Clients, EventState>
  type AppContext = Context | AppEventContext
  type WithSettingsArgs = {
    settings?: AppSettingsInput
    args?: { settings?: AppSettingsInput }
  }
  type WithSettingsField = GraphQLField<unknown, Context, WithSettingsArgs>
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
  type ProductDetails = {
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
    skuIds: number[]
  }
  type SkuDetails = {
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
}

export {}
