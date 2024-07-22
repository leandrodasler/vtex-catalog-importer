import { method } from '@vtex/api'

import { ONE_RESULT } from '../helpers'

export default {
  status: method({
    GET: async (context: Context) => {
      const user = await context.clients.adminAuth.getUser().catch(() => {
        context.status = 401
        context.body = 'Not allowed'
      })

      if (!user) return

      const {
        data: imports,
        pagination: { total: totalImports },
      } = await context?.clients.importExecution.searchRaw(
        { page: 1, pageSize: 10 },
        ['id', 'status', 'createdIn', 'lastInteractionIn'],
        'createdIn desc'
      )

      const {
        data: entities,
        pagination: { total: totalEntities },
      } = await context.clients.importEntity.searchRaw(
        ONE_RESULT,
        [
          'id',
          'executionImportId',
          'sourceAccount',
          'name',
          'sourceId',
          'targetId',
          'payload',
        ],
        'createdIn desc'
      )

      context.status = 200
      context.set('Content-Type', 'text/html')
      context.body = `<html>
          <head>
            <title>VTEX Catalog Importer Status</title>
            <meta http-equiv="refresh" content="5">
            <style>
                .flex {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 10px;
                }
                .flex section {
                  flex: 1;
                  max-width: 50%;
                  overflow: auto;
                  padding: 5px;
                  border: 1px solid #ccc;
                }
            </style>
          </head>
          <body>
            <h1>VTEX Catalog Importer Status</h1>
            <h2>Logged as ${user}</h2>
            <div class="flex">
                <section>
                  <h3>Imports - total: ${totalImports}</h3>
                  <p>Last 10 imports:</p>
                  <pre>${JSON.stringify(imports, null, 2)}</pre>
                </section>
                <section>
                  <h3>Entities - total: ${totalEntities}</h3>
                  <p>Last entity:</p>
                  <pre>${JSON.stringify(entities, null, 2)}</pre>
                </section>
            </div>
          </body>
        </html>`
    },
  }),
}
