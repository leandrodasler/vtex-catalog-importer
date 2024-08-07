import type { InstanceOptions, IOContext } from '@vtex/api'
import { JanusClient } from '@vtex/api'
import type { Warehouse } from 'ssesandbox04.catalog-importer'

import { ENDPOINTS } from '../helpers'

export default class PrivateClient extends JanusClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    super(context, {
      ...options,
      headers: { VtexIdclientAutcookie: context.adminUserAuthToken as string },
    })
  }

  public async getUser() {
    return this.http
      .post<User>(ENDPOINTS.user, { token: this.context.adminUserAuthToken })
      .then(({ user }) => user)
  }

  public async getWarehouses() {
    return this.http.get<Warehouse[]>(ENDPOINTS.stock.listWarehouses)
  }
}
