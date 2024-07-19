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

export const updateImportStatus = async (
  context: AppContext,
  id: string,
  status: ImportStatus
) => context.clients.importExecution.update(id, { status })

export const deleteImport = async (context: AppContext, importId: string) => {
  await updateImportStatus(context, importId, DELETING)
  const { importExecution, importEntity } = context.clients

  entityGetAll(importEntity, {
    fields: ['id'],
    where: `executionImportId=${importId}`,
  }).then((data) =>
    batch(data, ({ id }) => importEntity.delete(id)).then(() =>
      importExecution.delete(importId)
    )
  )
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
  getFirstImportByStatus(context, [TO_BE_DELETED])
