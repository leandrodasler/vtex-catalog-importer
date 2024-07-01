import type { GraphQLField } from 'graphql'
import { defaultFieldResolver } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import type { AppSettingsInput } from 'ssesandbox04.catalog-importer'

import { getCurrentSettings, getDefaultSettings } from '../../helpers'

type WithSettingsArgs = {
  settings?: AppSettingsInput
  args?: { settings?: AppSettingsInput }
}
type Field = GraphQLField<unknown, Context, WithSettingsArgs>

export default class WithSettings extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: Field) {
    const { resolve = defaultFieldResolver } = field

    field.resolve = async (...params) => {
      const [root, args, context, info] = params

      const settingsArg = args.settings ?? args.args?.settings
      const settings = settingsArg?.useDefault
        ? await getDefaultSettings(context)
        : settingsArg ?? (await getCurrentSettings(context))

      const { account, vtexAppKey, vtexAppToken } = settings
      const settingEmpty =
        !account?.trim() || !vtexAppKey?.trim() || !vtexAppToken?.trim()

      if (typeof settingsArg?.useDefault === 'boolean' && settingEmpty) {
        throw new Error('admin/settings.missing.error')
      }

      context.clients.httpClient.setSettings(settings)
      context.state.settings = settings

      return resolve(root, args, context, info)
    }
  }
}
