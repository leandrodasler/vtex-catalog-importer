/* eslint-disable no-console */

import { printStep } from '..'

const handleProducts = async (context: AppEventContext) => {
  context.state.step = 'products'
  printStep(context)
  console.log('process products')

  // TODO: process products import
}

export default handleProducts
