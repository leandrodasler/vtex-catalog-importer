import fs from 'fs'
import path from 'path'
import readline from 'readline'

export class FileManager {
  public filePath: string

  constructor(filePath: string) {
    this.filePath = path.resolve(__dirname, filePath)
  }

  public exists() {
    return fs.existsSync(this.filePath)
  }

  public delete() {
    if (!this.exists()) return

    return fs.unlinkSync(this.filePath)
  }

  public append(data: string) {
    return fs.appendFileSync(this.filePath, data, { encoding: 'utf8' })
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
        return line.split('=>')[1].trim()
      }
    }

    return null
  }
}
