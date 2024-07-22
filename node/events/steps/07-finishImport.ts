/* eslint-disable no-console */
import { delay, IMPORT_STATUS, updateCurrentImport } from '../../helpers'

const finishImport = async (context: AppEventContext) => {
  await delay(1000)
  await updateCurrentImport(context, { status: IMPORT_STATUS.SUCCESS })

  console.log('========================')
  console.log('FINISHED IMPORT')
  console.log(context.state.body)
}

export default finishImport
