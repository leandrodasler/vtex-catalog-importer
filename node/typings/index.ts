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
  type ProcessImport = WithInternalFields<Import>
  type ServiceState = RecorderState & { settings?: AppSettingsInput }
  type Context = ServiceContext<Clients, ServiceState>
  type EventState = {
    body: Partial<ProcessImport>
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
    AdWordsRemarketingCode: string
    LomadeeCampaignCode: string
    Score?: number
    LinkId?: string
  }
}

export {}
