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
  type EventState = {
    body: Partial<WithInternalFields<Import>>
    entity?: string
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
    Id?: number
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
    Id?: number
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
    TreePath: null
    TreePathIds: null
  }
}

export {}
