import type {
  ImportExecution,
  ImportStatus,
  Maybe,
} from 'ssesandbox04.catalog-importer'

import { IMPORT_EXECUTION_FIELDS, IMPORT_STATUS } from './constants'
import { batch, entityGetAll } from './utils'

const { PENDING, RUNNING, TO_BE_DELETED, DELETING } = IMPORT_STATUS

export const updateCurrentImport = async (
  context: AppEventContext,
  fields: Partial<ProcessImport>
) => {
  if (!context.state.body.id) return
  await context.clients.importExecution
    .update(context.state.body.id, fields)
    .then(() => (context.state.body = { ...context.state.body, ...fields }))
    .catch(() => {})
}

export const getExistingTargetId = async (
  context: AppEventContext,
  id: string | number = ''
) => {
  const { entity } = context.state
  const { account } = context.state.body.settings ?? {}

  return context.clients.importEntity
    .search(
      { page: 1, pageSize: 1 },
      ['targetId'],
      '',
      `(name=${entity})AND(sourceAccount=${account})AND(sourceId=${id})`
    )
    .then(([data]) => `${data?.targetId ?? ''}` || undefined)
}

export const updateImportStatus = async (
  context: AppContext,
  id: string,
  status: ImportStatus
) => context.clients.importExecution.update(id, { status })

export const deleteImport = async (context: AppContext, importId: string) => {
  const { catalog, importExecution, importEntity } = context.clients

  await updateImportStatus(context, importId, DELETING)
  await entityGetAll(importEntity, {
    fields: ['id', 'name', 'targetId'],
    where: `executionImportId=${importId}`,
  }).then((data) =>
    batch(data, ({ id, name, targetId }) => {
      if (name === 'brand' && targetId) {
        catalog.deleteBrand(targetId)
      }

      importEntity.delete(id)
    })
  )
  await importExecution.delete(importId)
}

const getFirstImportByStatus = async (
  context: AppContext,
  status: ImportStatus[]
) => {
  return context.clients.importExecution
    .searchRaw(
      { page: 1, pageSize: 1 },
      IMPORT_EXECUTION_FIELDS,
      'createdIn asc',
      status.map((s) => `(status=${s})`).join('OR')
    )
    .then(
      ({ data }) =>
        (data[0] as unknown) as Maybe<WithInternalFields<ImportExecution>>
    )
}

export const getFirstImportProcessing = async (context: AppContext) =>
  getFirstImportByStatus(context, [RUNNING, DELETING])

export const getFirstImportPending = async (context: AppContext) =>
  getFirstImportByStatus(context, [PENDING])

export const getFirstImportToBeDeleted = async (context: AppContext) =>
  getFirstImportByStatus(context, [DELETING, TO_BE_DELETED])
