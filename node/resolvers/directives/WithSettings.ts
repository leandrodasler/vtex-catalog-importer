import { defaultFieldResolver } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'

import { getCurrentSettings } from '../../helpers'

export default class WithSettings extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: WithSettingsField) {
    const { resolve = defaultFieldResolver } = field

    field.resolve = async (...params) => {
      const [root, args, context, info] = params

      const settingsArg = args.settings ?? args.args?.settings
      const settings = settingsArg?.useDefault
        ? await context.clients.httpClient.getDefaultSettings()
        : settingsArg ?? (await getCurrentSettings(context))

      const { account, vtexAppKey, vtexAppToken } = settings
      const settingEmpty =
        !account?.trim() || !vtexAppKey?.trim() || !vtexAppToken?.trim()

      if (typeof settingsArg?.useDefault === 'boolean' && settingEmpty) {
        throw new Error('admin/settings.missing.error')
      }

      context.clients.sourceCatalog.setSettings(settings)
      context.state.settings = settings

      return resolve(root, args, context, info)
    }
  }
}
