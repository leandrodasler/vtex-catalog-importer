import type { Maybe } from '@vtex/api'
import type {
  ImportEntity,
  ImportExecution,
  ImportStatus,
} from 'ssesandbox04.catalog-importer'

import { IMPORT_EXECUTION_FIELDS, IMPORT_STATUS, ONE_RESULT } from './constants'
import { batch } from './utils'

const { PENDING, RUNNING, TO_BE_DELETED, DELETING } = IMPORT_STATUS

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

export const getExistingTargetId = async (
  context: AppEventContext,
  sourceId: string | number = ''
) => {
  const { entity } = context.state
  const { account } = context.state.body.settings ?? {}
  const where = `(name=${entity})AND(sourceAccount=${account})AND(sourceId=${sourceId})`

  return context.clients.importEntity
    .search(ONE_RESULT, ['targetId'], '', where)
    .then(([data]) => (data?.targetId ? String(data.targetId) : undefined))
}

export const updateImportStatus = async (
  context: AppContext,
  id: string,
  status: ImportStatus
) => context.clients.importExecution.update(id, { status })

export const deleteImport = async (context: AppContext, importId: string) => {
  const { catalog, importExecution, importEntity } = context.clients

  await updateImportStatus(context, importId, DELETING)
  const mustDeleteImport = await importEntity
    .searchRaw(
      { page: 1, pageSize: 500 },
      ['id', 'name', 'targetId'],
      '',
      `executionImportId=${importId}`
    )
    .then(({ data, pagination: { total } }) => {
      batch(
        data as Array<WithInternalFields<ImportEntity>>,
        ({ id, name, targetId }) => {
          if (name === 'brand' && targetId) {
            catalog.deleteBrand(targetId)
          }

          importEntity.delete(id)
        }
      )

      return !total
    })
    .catch(() => {})

  if (mustDeleteImport) {
    await importExecution.delete(importId)
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
