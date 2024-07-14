/* eslint-disable no-console */

import {
  batch,
  IMPORT_EXECUTION_FULL_FIELDS,
  IMPORT_STATUS,
  STEPS_HANDLERS,
  updateImport,
} from '../helpers'

export const printStep = (context: AppEventContext) => {
  const {
    step,
    body: { id, status, sourceBrandsTotal, error },
  } = context.state

  console.log('========================')
  console.log(`"${step}" import step`)
  console.log(
    `IMPORT #${id} - status: ${status} | sourceBrandsTotal: ${sourceBrandsTotal} | error: ${error}`
  )
}

const runImport = async (context: AppEventContext) => {
  console.log('========================')
  console.log('"runImport" EVENT')
  console.log(context.state.body)

  const { id, settings } = context.state.body

  if (!id) return

  const { importExecution, httpClient } = context.clients

  try {
    if (!settings) {
      throw new Error('admin/settings.missing.error')
    }

    const importData = await importExecution.get(
      id,
      IMPORT_EXECUTION_FULL_FIELDS
    )

    httpClient.setSettings(settings)
    context.state.body = { ...importData, settings }

    await updateImport(context, { status: IMPORT_STATUS.RUNNING })
    await batch(STEPS_HANDLERS, (step) => step(context), 1)
    await updateImport(context, { status: IMPORT_STATUS.SUCCESS })

    console.log('========================')
    console.log('FINISHED IMPORT')
    console.log(context.state.body)
  } catch (e) {
    const step = context.state.step ?? 'starting import'
    const errorDetail = e.response?.data?.Message
    const error = `Error at step "${step}": ${e.message}${
      errorDetail ? ` - ${errorDetail}` : ''
    }`

    console.log('========================')
    console.log(error)

    await updateImport(context, { status: IMPORT_STATUS.ERROR, error })
  }
}

export default { runImport }
