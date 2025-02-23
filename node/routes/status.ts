import fs from 'fs'
import path from 'path'
import readline from 'readline'

import { method } from '@vtex/api'
import type {
  ImportEntity,
  ImportExecution,
} from 'ssesandbox04.catalog-importer'

import {
  batch,
  FileManager,
  formatFileSize,
  getLastEntity,
  IMPORT_ENTITY_FIELDS,
  IMPORT_EXECUTION_FIELDS,
  setCachedContext,
} from '../helpers'

const PAG = { page: 1, pageSize: 25 }
const SORT = 'createdIn desc'

const outputHTML = (data?: unknown[]) =>
  data?.length ? `<pre>${JSON.stringify(data, null, 2)}</pre>` : ''

const timeZone = 'America/Sao_Paulo'

const formatTimeElapsed = (begin: string | Date) => {
  const now = Date.now()
  const diff = now - new Date(begin).getTime()

  if (diff < 60 * 1000) {
    return `${Math.round(diff / 1000)}s ago`
  }

  if (diff < 60 * 60 * 1000) {
    return `${Math.round(diff / 1000 / 60)} min ago`
  }

  return `${Math.round(diff / 1000 / 60 / 60)}h ago`
}

const formatDate = (date: string | Date) =>
  `${new Date(date).toLocaleString('pt-BR', {
    timeZone,
  })} - ${formatTimeElapsed(date)}`

type FileRow = {
  name: string
  size: string
  lines: number
  created: string
  modified: string
  modifiedMs: number
}

function sortFiles(files: FileRow[]) {
  return files.sort((a, b) => a.modifiedMs - b.modifiedMs)
}

async function getFileTotalLines(filePath: string) {
  const fileStream = fs.createReadStream(filePath)

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  })

  let totalLines = 0

  for await (const line of rl) {
    if (line) totalLines++
  }

  return totalLines
}

function listFiles(directory: string): Promise<FileRow[]> {
  const results: FileRow[] = []

  return new Promise((resolve) => {
    fs.readdir(directory, (err, files) => {
      if (err) {
        results.push({
          name: `Erro ao ler o diretório: ${err.message}`,
          size: '---',
          lines: 0,
          created: '---',
          modified: '---',
          modifiedMs: 0,
        })
      }

      let pending = files.length

      if (pending === 0) {
        return resolve(results)
      }

      files.forEach((file) => {
        const filePath = path.join(directory, file)

        getFileTotalLines(filePath).then((lines) => {
          fs.stat(filePath, (e, stats) => {
            if (e) {
              results.push({
                name: `Erro ao obter informações do arquivo ${file}: ${e.message}`,
                size: '---',
                lines: 0,
                created: '---',
                modified: '---',
                modifiedMs: 0,
              })
            } else if (stats.isFile()) {
              results.push({
                name: file,
                size: formatFileSize(stats.size),
                lines,
                created: formatDate(stats.birthtime),
                modified: formatDate(stats.mtime),
                modifiedMs: stats.mtimeMs,
              })
            }

            pending--

            if (pending === 0) {
              resolve(sortFiles(results))
            }
          })
        })
      })
    })
  })
}

const status = async (context: Context) => {
  setCachedContext(context)

  const {
    privateClient,
    importExecution,
    importEntity,
    targetCatalog,
  } = context.clients

  const user = await privateClient.getUser().catch(() => {
    context.status = 401
    context.body = 'Not allowed'
  })

  if (!user) return

  const fileQuery = context.request.query?.file

  if (fileQuery) {
    const file = new FileManager(fileQuery)

    if (file.exists()) {
      context.status = 200
      context.type = 'text/plain'
      context.body = fs.createReadStream(file.filePath)

      return
    }
  }

  const reload = context.request.query?.reload === '1'

  const lastProductId = await targetCatalog.getLastProductId()
  const lastSkuId = await targetCatalog.getLastSkuId()

  const {
    data: dataImports,
    pagination: { total: totalImports },
  } = await importExecution.searchRaw(PAG, IMPORT_EXECUTION_FIELDS, SORT)

  const imports = await batch(
    dataImports as Array<WithInternalFields<ImportExecution>>,
    async (i) => {
      const lastEntity = await getLastEntity(context, i)

      const {
        createdIn,
        lastInteractionIn,
        settings,
        importImages,
        importPrices,
        targetWarehouse,
        status: importStatus,
        ...rest
      } = i

      return {
        sourceAccount: settings?.useDefault ? 'Default' : settings?.account,
        ...(lastEntity?.lastInteractionIn && {
          lastEntityLastInteraction: `${formatDate(
            lastEntity.lastInteractionIn
          )}`,
        }),
        createdDate: formatDate(createdIn),
        lastInteractionDate: formatDate(lastInteractionIn),
        status: `<strong class='status ${importStatus}'>${importStatus}</strong>`,
        ...rest,
      }
    }
  )

  const {
    data: dataEntities,
    pagination: { total: totalEntities },
  } = await importEntity.searchRaw(PAG, IMPORT_ENTITY_FIELDS, SORT)

  const entities = (dataEntities as Array<
    WithInternalFields<ImportEntity>
  >).map(({ createdIn, lastInteractionIn, ...e }) => ({
    createdDate: formatDate(createdIn),
    lastInteractionDate: formatDate(lastInteractionIn),
    ...e,
  }))

  const directoryToList = path.join(`${__dirname}/../helpers`)
  const indexFile = new FileManager('index.js', `${__dirname}/..`)
  const indexStats = await indexFile.getStats()
  const files = await listFiles(directoryToList)
  const { heapTotal, heapUsed } = process.memoryUsage()

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
        max-height: 700px;
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
      h1 span:not(:first-child) {
        margin-right: 5px;
      }
      .status { color: white; background-color: gray; padding: 2px; }
      .status.pending { background-color: orange; }
      .status.success { background-color: green; }
      .status.error, .status.deleting, .status.to_be_deleted { background-color: red; }
      .status.running { background-color: blue; }
      table, ul { font-family: monospace; }
    </style>
  </head>
  <body>
    <header>
      <h1>
        VTEX Catalog Importer Status
        <span>Version ${process.env.VTEX_APP_VERSION}</span>
        <span>Last SKU ID: ${lastSkuId}</span>
        <span>Last product ID: ${lastProductId}</span>
      </h1>
      <form>
        <label><input type="checkbox" name="reload" value="1" ${
          reload ? 'checked' : ''
        } onchange="this.form.submit()" />Reload automatically - Last update: ${formatDate(
    new Date()
  )}</label>
      </form>
      <h2>Logged as ${user}</h2>
    </header>
    <div class="flex">
      <section>
        <h3>Listing import files in directory <em>${directoryToList}</em>:</h3>
        <table border="1" cellpadding="5" cellspacing="0">
          <tr>
            <th>Name</th><th>Size</th><th>Lines</th><th>Created</th><th>Modified</th>
          </tr>
          ${
            !files.length
              ? '<tr><td colspan="5" align="center">No files found</td></tr>'
              : ''
          }
          ${files
            .filter((file) => !file.name.endsWith('.js'))
            .map(
              (file) =>
                `<tr>
                  <td><a target="_blank" href="?file=${file.name}">${file.name}</a></td>
                  <td>${file.size}</td>
                  <td>${file.lines}</td>
                  <td>${file.created}</td>
                  <td title="Timestamp: ${file.modifiedMs}">${file.modified}</td>
                </tr>`
            )
            .join('')}
        </table>
        <br />
        <div>
          <strong>INDEX FILE INFO:</strong>
          <ul>
            <li>PATH: ${indexFile.filePath}</li>
            <li>MODIFIED: ${formatDate(indexStats.mtime)}</li>
          </ul>
        </div>
        <br />
        <div>
          <strong>MEMORY INFO:</strong>
          <ul>
            <li>HEAP TOTAL: ${formatFileSize(heapTotal)}</li>
            <li>HEAP USED: ${formatFileSize(heapUsed)}</li>
          </ul>
        </div>
      </section>
      <section>
        <h3>Imports - showing ${imports.length} of ${totalImports}:</h3>
        ${outputHTML(imports)}
      </section>
      <section>
        <h3>Entities - showing ${entities.length} of ${totalEntities}:</h3>
        ${outputHTML(entities)}
      </section>
    </div>
  </body>
</html>`
}

export default method({ GET: status })
