import { defaultFieldResolver } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'

import { CURRENT_MD_SCHEMA, MD_ENTITIES } from '../../helpers'

const { VTEX_APP_VENDOR, VTEX_APP_NAME, VTEX_APP_VERSION } = process.env
const MD_APP_NAME = VTEX_APP_NAME?.replace(/-/g, '_')

const getEntityFullName = (entity: string) =>
  `${VTEX_APP_VENDOR}_${MD_APP_NAME}_${entity}`

const mdEntities = Object.values(MD_ENTITIES).map(getEntityFullName)

const getAndCleanSchemas = async (
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
            targetCatalog.deleteSchema(dataEntity, schemaName)
          }

          return schema
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
            dataEntity: mdEntities[i],
            schemaName: newSchemaName,
            schemaBody: schema as Record<string, unknown>,
          })
          .catch(() => null)
      )
  )
}

export default class WithCustomSchema extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: WithCustomSchemaField) {
    const { resolve = defaultFieldResolver } = field

    field.resolve = async (...params) => {
      const [root, args, context, info] = params
      const { workspace } = context.vtex
      const defaultSchema = VTEX_APP_VERSION as string
      const workspaceSchema = `${defaultSchema}-${workspace}`
      const isWorkspaceMaster = workspace === 'master'

      // getting and deleting schemas created by masterdata builder
      const schemas = await (isWorkspaceMaster
        ? getAndCleanSchemas(context, mdEntities, defaultSchema)
        : getAndCleanSchemas(context, mdEntities, workspaceSchema))

      // creating new schemas with a known name
      await createSchemas(context, schemas, CURRENT_MD_SCHEMA)

      if (!isWorkspaceMaster) {
        await createSchemas(
          context,
          schemas,
          `${CURRENT_MD_SCHEMA}-${workspace}`
        )
      }

      return resolve(root, args, context, info)
    }
  }
}
