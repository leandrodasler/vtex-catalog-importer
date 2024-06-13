function runImport(context: AppEventContext) {
  // eslint-disable-next-line no-console
  console.log('RECEIVED EVENT', context.body)
}

export default { runImport }
