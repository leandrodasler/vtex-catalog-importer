import { method } from '@vtex/api'
import type {
  ImportEntity,
  ImportExecution,
} from 'ssesandbox04.catalog-importer'

import {
  batch,
  DEFAULT_VBASE_BUCKET,
  getLastEntity,
  IMPORT_ENTITY_FIELDS,
  IMPORT_EXECUTION_FIELDS,
  setCachedContext,
} from '../helpers'

const PAG = { page: 1, pageSize: 500 }
const SORT = 'createdIn desc'

const outputHTML = (data?: unknown[]) =>
  data?.length ? `<pre>${JSON.stringify(data, null, 2)}</pre>` : ''

const formatDate = (date: string | Date) =>
  `${new Date(date).toLocaleString('pt-BR')} UTC`

const diffDate = (date: string) => Date.now() - new Date(date).getTime()

const status = async (context: Context) => {
  setCachedContext(context)

  const {
    privateClient,
    importExecution,
    importEntity,
    targetCatalog,
    vbase,
  } = context.clients

  const user = await privateClient.getUser().catch(() => {
    context.status = 401
    context.body = 'Not allowed'
  })

  if (!user) return

  const reload = context.request.query?.reload === '1'

  const {
    data: dataImports,
    pagination: { total: totalImports },
  } = await importExecution.searchRaw(PAG, IMPORT_EXECUTION_FIELDS, SORT)

  const imports = await batch(
    dataImports as Array<WithInternalFields<ImportExecution>>,
    async (i) => {
      const lastEntity = await getLastEntity(context, i)

      return {
        ...(lastEntity?.createdIn && {
          lastEntityDate: `${formatDate(lastEntity.createdIn)} - ${Math.floor(
            diffDate(lastEntity.createdIn) / 1000 / 60
          )} minutes ago`,
        }),
        date: formatDate(i.createdIn),
        dateLastInteraction: formatDate(i.lastInteractionIn),
        ...i,
        vbaseJson: await vbase.getJSON(DEFAULT_VBASE_BUCKET, i.id, true),
      }
    }
  )

  const {
    data: dataEntities,
    pagination: { total: totalEntities },
  } = await importEntity.searchRaw(PAG, IMPORT_ENTITY_FIELDS, SORT)

  const entities = (dataEntities as Array<
    WithInternalFields<ImportEntity>
  >).map((e) => ({
    ...(e?.createdIn && { date: formatDate(e.createdIn) }),
    ...e,
  }))

  const targetBrands = await targetCatalog.getBrands()
  const categories = await targetCatalog.getCategoryTreeFlattened()
  const targetCategories = categories.map(({ children, ...c }) => ({
    ...c,
    ...(children?.length && {
      children: children.map((ch) => ch.id).join(','),
    }),
  }))

  context.status = 200
  context.set('Content-Type', 'text/html')
  context.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  context.set('Pragma', 'no-cache')
  context.body = `<html>
  <head>
    <title>VTEX Catalog Importer Status</title>
    ${reload ? '<meta http-equiv="refresh" content="5">' : ''}
    <meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
    <style>
      body {
        padding: 10px;
        margin: 0;
        font-family: system-ui;
      }
      .flex {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .flex section {
        flex: 1;
        max-width: 50%;
        min-width: 45%;
        max-height: 500px;
        overflow: auto;
        padding: 5px;
        border: 1px solid #ccc;
      }
      pre {
        word-break: break-word;
        white-space: break-spaces;
      }
      h1 span {
        float: right;
        padding: 5px;
        border-radius: 5px;
        background: #ccc;
        font-size: 50%;
      }
    </style>
  </head>
  <body>
    <h1>VTEX Catalog Importer Status <span>Version ${
      process.env.VTEX_APP_VERSION
    }</span></h1>
    <form>
      <label><input type="checkbox" name="reload" value="1" ${
        reload ? 'checked' : ''
      } onchange="this.form.submit()" />Reload automatically - Last update: ${formatDate(
    new Date()
  )}</label>
    </form>
    <h2>Logged as ${user}</h2>
    <div class="flex">
    <section>
      <h3>Imports - total: ${totalImports}</h3>
      ${outputHTML(imports)}
    </section>
    <section>
      <h3>Entities - total: ${totalEntities}</h3>
      ${outputHTML(entities)}
    </section>
      <section>
        <h3>Target active brands - total: ${targetBrands.length}</h3>
        ${outputHTML(targetBrands)}
      </section>
      <section>
        <h3>Target active categories - total: ${targetCategories.length}</h3>
        ${outputHTML(targetCategories)}
      </section>
    </div>
  </body>
</html>`
}

export default method({ GET: status })
