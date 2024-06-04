import type { GraphQLField } from 'graphql'
import { defaultFieldResolver } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import type { AppSettingsInput } from 'ssesandbox04.catalog-importer'

import { DEFAULT_SETTINGS } from '../helpers'

type WithSettingsArgs = { settings?: AppSettingsInput }
type Field = GraphQLField<unknown, Context, WithSettingsArgs>

export class WithSettings extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: Field) {
    const { resolve = defaultFieldResolver } = field

    field.resolve = async (...params) => {
      const [root, args, context, info] = params

      // eslint-disable-next-line no-console
      console.log('===================================================')
      // eslint-disable-next-line no-console
      console.log('WithSettings - before operation:', field.name)

      if (
        args.settings?.useDefault &&
        (!DEFAULT_SETTINGS.account ||
          DEFAULT_SETTINGS.account === '{{sourceAccount}}' ||
          !DEFAULT_SETTINGS.vtexAppKey ||
          DEFAULT_SETTINGS.vtexAppKey === '{{sourceVtexAppKey}}' ||
          !DEFAULT_SETTINGS.vtexAppToken ||
          DEFAULT_SETTINGS.vtexAppToken === '{{sourceVtexAppToken}}')
      ) {
        // eslint-disable-next-line no-console
        console.log('WithSettings - throwing admin/settings.default.error')
        // eslint-disable-next-line no-console
        console.log('===================================================')
        throw new Error('admin/settings.default.error')
      }

      const getCurrentSettings = async () => {
        const currentSettings = (await context.clients.apps.getAppSettings(
          process.env.VTEX_APP_ID as string
        )) as AppSettingsInput

        // eslint-disable-next-line no-console
        console.log('WithSettings - using current settings:', currentSettings)

        return currentSettings
      }

      if (args.settings?.useDefault) {
        // eslint-disable-next-line no-console
        console.log('WithSettings - using default settings:', DEFAULT_SETTINGS)
      } else if (args.settings) {
        // eslint-disable-next-line no-console
        console.log('WithSettings - using args settings:', args.settings)
      }

      const settings = args.settings?.useDefault
        ? DEFAULT_SETTINGS
        : args.settings ?? (await getCurrentSettings())

      if (
        args.settings?.useDefault !== undefined &&
        (!settings.account || !settings.vtexAppKey || !settings.vtexAppToken)
      ) {
        // eslint-disable-next-line no-console
        console.log('WithSettings - throwing admin/settings.missing.error')
        // eslint-disable-next-line no-console
        console.log('===================================================')
        throw new Error('admin/settings.missing.error')
      }

      context.clients.httpClient.setSettings(settings)
      context.state.body = { settings }

      // eslint-disable-next-line no-console
      console.log('===================================================')

      return resolve(root, args, context, info)
    }
  }
}
