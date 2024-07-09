/* eslint-disable no-console */

import { IMPORT_STATUS, updateImportStatus } from '../../helpers'

export const categories = async (context: AppEventContext) => {
  console.log('========================')
  console.log('"categories" import step')
  console.log(context.state.body)
  console.log('process categories')

  // TODO: process categories import
  await updateImportStatus(context, IMPORT_STATUS.SUCCESS)
}
