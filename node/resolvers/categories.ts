export const categories = () => {
  const mock = [
    {
      id: '1',
      name: 'Eletrônicos',
      subCategories: [
        {
          id: '1-1',
          name: 'Computadores',
          subCategories: [
            {
              id: '1-1-1',
              name: 'Notebooks',
              subCategories: [
                {
                  id: '1-1-1-1',
                  name: 'Ultrabooks',
                },
                {
                  id: '1-1-1-2',
                  name: 'Gaming',
                },
                {
                  id: '1-1-1-3',
                  name: 'Portátil',
                },
              ],
            },
            {
              id: '1-1-2',
              name: 'Desktops',
            },
          ],
        },
        {
          id: '1-2',
          name: 'Televisores',
        },
        {
          id: '1-3',
          name: 'Smartphones',
          subCategories: [
            {
              id: '1-3-1',
              name: 'Novos',
            },
            {
              id: '1-3-2',
              name: 'Usados',
            },
          ],
        },
      ],
    },
    {
      id: '2',
      name: 'Máquinas',
      subCategories: [
        {
          id: '2-1',
          name: 'Ferramentas Elétricas',
          subCategories: [
            {
              id: '2-1-1',
              name: 'Furadeiras',
            },
            {
              id: '2-1-2',
              name: 'Parafusadeiras',
            },
          ],
        },
        {
          id: '2-2',
          name: 'Máquinas Pesadas',
          subCategories: [
            {
              id: '2-2-1',
              name: 'Escavadeiras',
            },
            {
              id: '2-2-2',
              name: 'Pás Carregadeiras',
            },
          ],
        },
      ],
    },
    {
      id: '3',
      name: 'Alimentação',
      subCategories: [
        {
          id: '3-1',
          name: 'Bebidas',
          subCategories: [
            {
              id: '3-1-1',
              name: 'Sucos',
              subCategories: [
                {
                  id: '3-1-1-1',
                  name: 'Sucos Naturais',
                  subCategories: [
                    {
                      id: '3-1-1-1-1',
                      name: 'Laranja',
                      subCategories: [
                        {
                          id: '3-1-1-1-1-1',
                          name: 'Orgânico',
                        },
                        {
                          id: '3-1-1-1-1-2',
                          name: 'Convencional',
                        },
                        {
                          id: '3-1-1-1-1-3',
                          name: 'Com Gelo',
                        },
                      ],
                    },
                    {
                      id: '3-1-1-1-2',
                      name: 'Maçã',
                      subCategories: [
                        {
                          id: '3-1-1-1-2-1',
                          name: 'Orgânico',
                        },
                        {
                          id: '3-1-1-1-2-2',
                          name: 'Convencional',
                        },
                        {
                          id: '3-1-1-1-2-3',
                          name: 'Com Gelo',
                        },
                      ],
                    },
                    {
                      id: '3-1-1-1-3',
                      name: 'Uva',
                      subCategories: [
                        {
                          id: '3-1-1-1-3-1',
                          name: 'Orgânico',
                        },
                        {
                          id: '3-1-1-1-3-2',
                          name: 'Convencional',
                        },
                        {
                          id: '3-1-1-1-3-3',
                          name: 'Com Gelo',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              id: '3-1-2',
              name: 'Refrigerantes',
            },
          ],
        },
        {
          id: '3-2',
          name: 'Comidas',
          subCategories: [
            {
              id: '3-2-1',
              name: 'Lanches',
            },
            {
              id: '3-2-2',
              name: 'Refeições',
            },
          ],
        },
      ],
    },
  ]

  return mock
}
