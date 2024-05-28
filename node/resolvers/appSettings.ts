export const appSettings = async (
  _: unknown,
  __: unknown,
  context: Context
) => {
  // eslint-disable-next-line no-console
  console.log(
    'appSettings resolver\n============================================================'
  )

  return context.state.body.settings
}
