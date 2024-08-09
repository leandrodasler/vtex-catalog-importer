import type { InstanceOptions, IOContext } from '@vtex/api'
import { JanusClient } from '@vtex/api'

import { ENDPOINTS } from '../helpers'

export default class PrivateClient extends JanusClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    const { adminUserAuthToken, authToken } = context
    const VtexIdclientAutcookie = (adminUserAuthToken ?? authToken) as string

    super(context, { ...options, headers: { VtexIdclientAutcookie } })
  }

  public async getUser() {
    return this.http
      .post<User>(ENDPOINTS.user, { token: this.context.adminUserAuthToken })
      .then(({ user }) => user)
  }
}
