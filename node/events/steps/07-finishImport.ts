import { IMPORT_STATUS, updateCurrentImport } from '../../helpers'

const finishImport = async (context: AppEventContext) => {
  await updateCurrentImport(context, { status: IMPORT_STATUS.SUCCESS })
}

export default finishImport
