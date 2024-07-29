import type { Maybe } from '@vtex/api'
import type {
  ImportEntity,
  ImportExecution,
  ImportStatus,
} from 'ssesandbox04.catalog-importer'

import {
  DEFAULT_BATCH_CONCURRENCY,
  IMPORT_ENTITY_FIELDS,
  IMPORT_EXECUTION_FIELDS,
  IMPORT_STATUS,
  ONE_RESULT,
} from './constants'
import { batch } from './utils'

const { PENDING, RUNNING, TO_BE_DELETED, DELETING } = IMPORT_STATUS

const getEntities = async (
  context: AppContext,
  importId: string,
  pageSize: number
) => {
  const { data, pagination } = await context.clients.importEntity.searchRaw(
    { page: 1, pageSize },
    IMPORT_ENTITY_FIELDS,
    'createdIn desc',
    `executionImportId=${importId}`
  )

  return { data, pagination } as {
    data: Array<WithInternalFields<ImportEntity>>
    pagination: typeof pagination
  }
}

const deleteEntityFactory = (context: AppContext) => (
  entity: WithInternalFields<ImportEntity>
) => {
  const { importEntity, targetCatalog } = context.clients
  const { id, name, targetId } = entity

  importEntity.delete(id)

  /* remove this after */
  if (name && targetId) {
    targetCatalog.deleteEntity(name, targetId)
  }
}

export const updateCurrentImport = async (
  context: AppEventContext,
  fields: EventState['body']
) => {
  if (!context.state.body.id) return
  await context.clients.importExecution
    .update(context.state.body.id, fields)
    .then(() => (context.state.body = { ...context.state.body, ...fields }))
    .catch(() => {})
}

export const updateImportStatus = async (
  context: AppContext,
  id: string,
  status: ImportStatus
) => context.clients.importExecution.update(id, { status })

export const getEntityBySourceId = (
  context: AppEventContext,
  entity: string,
  sourceId: string | number
) => {
  const { id } = context.state.body

  return context.clients.importEntity
    .search(
      ONE_RESULT,
      IMPORT_ENTITY_FIELDS,
      '',
      `(executionImportId=${id})AND(name=${entity})AND(sourceId=${sourceId})`
    )
    .then(
      (data) => (data[0] as unknown) as Maybe<WithInternalFields<ImportEntity>>
    )
}

export const deleteImport = async (context: AppContext, importId: string) => {
  await updateImportStatus(context, importId, DELETING)
  const entities = await getEntities(
    context,
    importId,
    DEFAULT_BATCH_CONCURRENCY
  )

  batch(entities.data, deleteEntityFactory(context))

  if (!entities.pagination.total) {
    context.clients.importExecution.delete(importId)
  }
}

const getFirstImportByStatus = async (
  context: AppContext,
  status: ImportStatus[]
) => {
  return context.clients.importExecution
    .search(
      ONE_RESULT,
      IMPORT_EXECUTION_FIELDS,
      'createdIn asc',
      status.map((s) => `(status=${s})`).join('OR')
    )
    .then(
      (data) =>
        (data[0] as unknown) as Maybe<WithInternalFields<ImportExecution>>
    )
}

export const getFirstImportRunning = async (context: AppContext) =>
  getFirstImportByStatus(context, [RUNNING])

export const getFirstImportPending = async (context: AppContext) =>
  getFirstImportByStatus(context, [PENDING])

export const getFirstImportToBeDeleted = async (context: AppContext) =>
  getFirstImportByStatus(context, [DELETING, TO_BE_DELETED])
