/* eslint-disable no-console */
import { IMPORT_STATUS, printImport, updateCurrentImport } from '../../helpers'

const finishImport = async (context: AppEventContext) => {
  await updateCurrentImport(context, { status: IMPORT_STATUS.SUCCESS })

  console.log('========================')
  console.log('FINISHED IMPORT')
  printImport(context)
}

export default finishImport
