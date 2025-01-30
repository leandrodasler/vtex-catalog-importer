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

  public read() {
    return fs.readFileSync(this.filePath, 'utf8')
  }

  public async findLine(prefix: string | number) {
    if (!this.exists()) return null

    // const fileStream = fs.createReadStream(this.filePath)

    const rl = this.getLineIterator() /* readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    }) */

    for await (const line of rl) {
      if (line.startsWith(`${prefix}=>`)) {
        return line.split('=>')[1].trim()
      }
    }

    return null
  }

  public getLineIterator() {
    const fileStream = fs.createReadStream(this.filePath)

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    })

    return rl
  }

  public async getFirstLine(rl: readline.Interface) {
    for await (const line of rl) {
      return line
    }

    return null
  }
}
