declare module 'vtex.styleguide'
declare module 'react-intl' {
  export const useIntl: () => IntlShape
}

declare module '*.graphql' {
  import type { DocumentNode } from 'graphql'

  const value: DocumentNode
  export default value
}
