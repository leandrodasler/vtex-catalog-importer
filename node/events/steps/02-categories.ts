/* eslint-disable no-console */

import { printStep } from '..'

const handleCategories = async (context: AppEventContext) => {
  context.state.step = 'categories'
  printStep(context)
  console.log('process categories')

  // TODO: process categories import
}

export default handleCategories
