import type { GraphQLField } from 'graphql'
import { defaultFieldResolver } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'

export class WithSettings extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: GraphQLField<unknown, Context>) {
    const { resolve = defaultFieldResolver } = field

    field.resolve = async (...params) => {
      const [root, args, context, info] = params

      const {
        clients: { apps, httpClient },
      } = context

      const appId = process.env.VTEX_APP_ID as string

      const {
        account = '',
        vtexAppKey = '',
        vtexAppToken = '',
      } = (await apps.getAppSettings(appId)) as Settings

      if (!account || !vtexAppKey || !vtexAppToken) {
        throw new Error('admin/settings.missing.error')
      }

      httpClient.setSettings({ account, vtexAppKey, vtexAppToken })
      context.state.body = { settings: { account, vtexAppKey, vtexAppToken } }

      return resolve(root, args, context, info)
    }
  }
}
