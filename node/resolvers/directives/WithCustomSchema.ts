import { defaultFieldResolver } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'

import { MD_ENTITIES, STABLE_MD_SCHEMA } from '../../helpers'
import importEntitySchema from '../../masterdata/importEntity/schema.json'
import importExecutionSchema from '../../masterdata/importExecution/schema.json'

const { VTEX_APP_VENDOR, VTEX_APP_NAME, VTEX_APP_VERSION } = process.env
const MD_APP_NAME = VTEX_APP_NAME?.replace(/-/g, '_')

const getEntityFullName = (entity: string) =>
  `${VTEX_APP_VENDOR}_${MD_APP_NAME}_${entity}`

const ENTITIES = Object.values(MD_ENTITIES).map(getEntityFullName)
const SCHEMAS = [importExecutionSchema, importEntitySchema]
const SETTINGS_VBASE_KEY = 'settings'

const cleanDefaultSchemas = async (
  { clients: { masterdata, targetCatalog } }: Context,
  entities: string[],
  schemaName: string
) => {
  return Promise.all(
    entities.map(async (dataEntity) =>
      masterdata
        .getSchema({
          dataEntity,
          schema: schemaName,
        })
        .catch(() => null)
        .then((schema) => {
          if (schema) {
            return targetCatalog.deleteSchema(dataEntity, schemaName)
          }

          return null
        })
    )
  )
}

const createSchemas = async (
  { clients: { masterdata } }: Context,
  schemas: unknown[],
  newSchemaName: string
) => {
  return Promise.all(
    schemas
      .filter((s) => s)
      .map(async (schema, i) =>
        masterdata
          .createOrUpdateSchema({
            dataEntity: ENTITIES[i],
            schemaName: newSchemaName,
            schemaBody: schema as Record<string, unknown>,
          })
          .catch((e) => {
            if (e.response.status !== 304) {
              throw e
            }

            return schema
          })
      )
  )
}

export default class WithCustomSchema extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: WithCustomSchemaField) {
    const { resolve = defaultFieldResolver } = field

    field.resolve = async (...params) => {
      const [root, args, context, info] = params
      const { workspace, production } = context.vtex
      const defaultSchema = VTEX_APP_VERSION as string
      const workspaceSchema = `${defaultSchema}-${workspace}`
      const settings = await context.clients.mdSettings.get(
        SETTINGS_VBASE_KEY,
        true
      )

      const currentVersion = production ? defaultSchema : workspaceSchema
      const currentSchemaHash = JSON.stringify(SCHEMAS)

      if (
        settings?.schemaHash === currentSchemaHash &&
        settings?.currentVersion === currentVersion
      ) {
        return resolve(root, args, context, info)
      }

      // deleting schemas created by masterdata builder
      cleanDefaultSchemas(context, ENTITIES, currentVersion)

      // creating new schemas with a known name
      await createSchemas(context, SCHEMAS, STABLE_MD_SCHEMA)

      if (!production) {
        await createSchemas(
          context,
          SCHEMAS,
          `${STABLE_MD_SCHEMA}-${workspace}`
        )
      }

      await context.clients.mdSettings.save(SETTINGS_VBASE_KEY, {
        schemaHash: JSON.stringify(SCHEMAS),
        currentVersion,
      })

      return resolve(root, args, context, info)
    }
  }
}
