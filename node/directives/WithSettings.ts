import type { GraphQLField } from 'graphql'
import { defaultFieldResolver } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import type { AppSettingsInput } from 'ssesandbox04.catalog-importer'

type WithSettingsArgs = { settings?: AppSettingsInput }

export class WithSettings extends SchemaDirectiveVisitor {
  public visitFieldDefinition(
    field: GraphQLField<unknown, Context, WithSettingsArgs>
  ) {
    const { resolve = defaultFieldResolver } = field

    field.resolve = async (...params) => {
      const [root, args, context, info] = params

      const {
        clients: { apps, httpClient },
      } = context

      const appId = process.env.VTEX_APP_ID as string
      const settings =
        args.settings ??
        ((await apps.getAppSettings(appId)) as AppSettingsInput)

      // eslint-disable-next-line no-console
      console.log('WithSettings - current settings:', settings)
      const { account = '', vtexAppKey = '', vtexAppToken = '' } = settings

      // eslint-disable-next-line no-console
      console.log('WithSettings args:', args)
      // const listApps = await apps.listApps()

      // console.log(
      //   'WithSettings - has ssesandbox04.catalog-importer:',
      //   JSON.stringify(
      //     listApps.data.find((app) =>
      //       app.id.includes('ssesandbox04.catalog-importer')
      //     )
      //   )
      // )

      if (!account || !vtexAppKey || !vtexAppToken) {
        throw new Error('admin/settings.missing.error')
      }

      httpClient.setSettings(settings)
      context.state.body = { settings }

      return resolve(root, args, context, info)
    }
  }
}
