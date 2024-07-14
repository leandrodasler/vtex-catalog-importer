/* eslint-disable no-console */

import { printStep } from '..'

const handleSkus = async (context: AppEventContext) => {
  context.state.step = 'skus'
  printStep(context)
  console.log('process skus')

  // TODO: process skus import
}

export default handleSkus
