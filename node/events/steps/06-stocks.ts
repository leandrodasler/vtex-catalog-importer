/* eslint-disable no-console */

import { printStep } from '..'

const handleStocks = async (context: AppEventContext) => {
  context.state.step = 'stocks'
  printStep(context)
  console.log('process stocks')

  // TODO: process stocks import
}

export default handleStocks
