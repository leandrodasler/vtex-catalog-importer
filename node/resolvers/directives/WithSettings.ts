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

      const {
        authType = 'appKey',
        account,
        vtexAppKey,
        vtexAppToken,
        userToken,
      } = settings

      const settingEmpty =
        (authType === 'appKey' &&
          (!account?.trim() || !vtexAppKey?.trim() || !vtexAppToken?.trim())) ||
        (authType === 'userToken' && (!account?.trim() || !userToken?.trim()))

      if (typeof settingsArg?.useDefault === 'boolean' && settingEmpty) {
        if (authType === 'appKey') {
          throw new Error('admin/settings.missing.error')
        } else {
          throw new Error('admin/settings.authType.userToken.missing.error')
        }
      }

      const currentSettings =
        settings.useDefault && settingEmpty
          ? await context.clients.httpClient.getDefaultSettings()
          : settings

      context.clients.sourceCatalog.setSettings(currentSettings)
      context.state.settings = settings

      return resolve(root, args, context, info)
    }
  }
}
