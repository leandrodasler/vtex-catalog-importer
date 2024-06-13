import type { GraphQLField } from 'graphql'
import { defaultFieldResolver } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'
import type { AppSettingsInput } from 'ssesandbox04.catalog-importer'

import { getCurrentSettings, getDefaultSettings } from '../helpers'

type WithSettingsArgs = { settings?: AppSettingsInput }
type Field = GraphQLField<unknown, Context, WithSettingsArgs>

export default class WithSettings extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: Field) {
    const { resolve = defaultFieldResolver } = field

    field.resolve = async (...params) => {
      const [root, args, context, info] = params

      const settings = args.settings?.useDefault
        ? await getDefaultSettings(context)
        : args.settings ?? (await getCurrentSettings(context))

      if (
        args.settings?.useDefault !== undefined &&
        (!settings.account || !settings.vtexAppKey || !settings.vtexAppToken)
      ) {
        throw new Error('admin/settings.missing.error')
      }

      await context.clients.events.sendEvent('', 'settings', settings)
      context.clients.httpClient.setSettings(settings)
      context.state.body = { settings }

      return resolve(root, args, context, info)
    }
  }
}
