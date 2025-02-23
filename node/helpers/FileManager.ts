import fs from 'fs'
import path from 'path'
import readline from 'readline'

export class FileManager {
  public filePath: string

  constructor(filePath: string, basePath = __dirname) {
    this.filePath = path.resolve(basePath, filePath)
  }

  public exists() {
    return fs.existsSync(this.filePath)
  }

  public delete() {
    if (!this.exists()) return

    return fs.promises.unlink(this.filePath)
  }

  public appendLine(line: string) {
    return fs.appendFileSync(this.filePath, `${line}\n`)
  }

  public getWriteStream() {
    return fs.createWriteStream(this.filePath, { flags: 'a', encoding: 'utf8' })
  }

  public getLineIterator() {
    const fileStream = fs.createReadStream(this.filePath)

    return readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    })
  }

  public async findLine(prefix: string | number) {
    if (!this.exists()) return null

    const lineIterator = this.getLineIterator()

    for await (const line of lineIterator) {
      if (line.startsWith(`${prefix}=>`)) {
        lineIterator.removeAllListeners()
        lineIterator.close()

        return line.split('=>')[1].trim()
      }
    }

    lineIterator.removeAllListeners()
    lineIterator.close()

    return null
  }

  public async getTotalLines() {
    const lineIterator = this.getLineIterator()
    let totalLines = 0

    for await (const line of lineIterator) {
      if (line) totalLines++
    }

    return totalLines
  }

  public async getStats() {
    return fs.promises.stat(this.filePath)
  }
}
