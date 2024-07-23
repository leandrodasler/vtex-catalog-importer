import type { Maybe } from '@vtex/api'
import type {
  ImportEntity,
  ImportExecution,
  ImportStatus,
} from 'ssesandbox04.catalog-importer'

import {
  DELETE_CONCURRENCY,
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
    '',
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
  context.clients.importEntity.delete(entity.id)
  if (entity.targetId && entity.name === 'brand') {
    context.clients.catalog.deleteBrand(entity.targetId)
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

export const deleteImport = async (context: AppContext, importId: string) => {
  await updateImportStatus(context, importId, DELETING)
  const entities = await getEntities(context, importId, DELETE_CONCURRENCY)

  batch(entities.data, deleteEntityFactory(context), DELETE_CONCURRENCY)

  if (!entities.pagination.total) {
    context.clients.importExecution.delete(importId)
  }
}

const getFirstImportByStatus = async (
  context: AppContext,
  status: ImportStatus[]
) => {
  return context.clients.importExecution
    .searchRaw(
      ONE_RESULT,
      IMPORT_EXECUTION_FIELDS,
      'createdIn asc',
      status.map((s) => `(status=${s})`).join('OR')
    )
    .then(
      ({ data }) =>
        (data[0] as unknown) as Maybe<WithInternalFields<ImportExecution>>
    )
}

export const getFirstImportRunning = async (context: AppContext) =>
  getFirstImportByStatus(context, [RUNNING])

export const getFirstImportPending = async (context: AppContext) =>
  getFirstImportByStatus(context, [PENDING])

export const getFirstImportToBeDeleted = async (context: AppContext) =>
  getFirstImportByStatus(context, [DELETING, TO_BE_DELETED])
