import type { Category } from 'ssesandbox04.catalog-importer'

export const convertCategory = (c: ApiCategory): Partial<Category> =>
  ({
    id: String(c.id),
    name: c.name,
    ...(c.children?.length && {
      subCategories: c.children.map(convertCategory),
    }),
  } as Partial<Category>)
