import { IOClients } from '@vtex/api'

import HttpClient from './HttpClient'

export class Clients extends IOClients {
  public get httpClient() {
    return this.getOrSet('httpClient', HttpClient)
  }
}
