const runImport = (context: AppEventContext) => {
  // eslint-disable-next-line no-console
  console.log('RECEIVED EVENT:', context.state.body)
}

export default { runImport }
