/* eslint-disable no-console */

import { printStep } from '..'

const handlePrices = async (context: AppEventContext) => {
  context.state.step = 'prices'
  printStep(context)
  console.log('process prices')

  // TODO: process prices import
}

export default handlePrices
