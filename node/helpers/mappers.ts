import type { Brand } from '@vtex/clients'

export const brandMapper = (brand: Brand) => ({
  Id: brand.id,
  Name: brand.name,
  Text: brand.metaTagDescription ?? brand.name,
  Active: brand.isActive,
})
