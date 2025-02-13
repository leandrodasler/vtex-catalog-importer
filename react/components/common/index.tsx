import type { ResponsiveProp } from '@vtex/admin-ui'
import {
  Alert,
  Center,
  DataView,
  Flex,
  IconCaretDown,
  IconCaretRight,
  IconCheckCircle,
  IconXCircle,
  Spinner,
  Stack,
  Text,
  csx,
  useDataViewState,
} from '@vtex/admin-ui'
import React, { useCallback, useMemo } from 'react'
import TreeView, { flattenTree } from 'react-accessible-treeview'
import type { MessageDescriptor } from 'react-intl'
import { useIntl } from 'react-intl'
import type { Category, Import } from 'ssesandbox04.catalog-importer'

import type { GraphQLError } from '../graphql'
import { getGraphQLMessageDescriptor } from '../graphql'
import { messages } from './messages'

export { default as MainTemplate } from './MainTemplate'
export { messages } from './messages'

export const SuspenseFallback = () => (
  <Center className={csx({ height: '25vh', width: '100%' })}>
    <Spinner />
  </Center>
)

type ErrorMessageProps = React.PropsWithChildren<{
  error?: string | GraphQLError
  title?: string | MessageDescriptor
}>

export const ErrorMessage = ({ error, title, children }: ErrorMessageProps) => {
  const { formatMessage } = useIntl()

  return (
    <Alert variant="critical" className={csx({ wordBreak: 'break-word' })}>
      <Stack space="$space-2" fluid>
        {title && (
          <Text variant="action1">
            {typeof title === 'string' ? title : formatMessage(title)}
          </Text>
        )}
        {!!error && (
          <Text>
            {typeof error === 'string'
              ? error
              : formatMessage(getGraphQLMessageDescriptor(error))}
          </Text>
        )}
        {children}
      </Stack>
    </Alert>
  )
}

export const handleTrim = (e: React.FormEvent<HTMLInputElement>) => {
  e.currentTarget.value = e.currentTarget.value.trim()
}

export const Checked = () => {
  const { formatMessage } = useIntl()

  return (
    <IconCheckCircle
      title={formatMessage(messages.yesLabel)}
      weight="fill"
      className={csx({ color: '$positive' })}
    />
  )
}

export const Unchecked = () => {
  const { formatMessage } = useIntl()

  return (
    <IconXCircle
      title={formatMessage(messages.noLabel)}
      weight="fill"
      className={csx({ color: '$critical' })}
    />
  )
}

const loadingTheme = csx({ animation: 'unset' })

export const Loading = () => <Spinner size={20} className={loadingTheme} />

type EmptyViewProps = { text: string; onClick: () => void }
export const EmptyView = ({ text, onClick }: EmptyViewProps) => {
  const state = useDataViewState({
    notFound: false,
    loading: false,
    empty: { action: { text, onClick } },
    error: null,
  })

  return <DataView state={state} />
}

export const useStatusLabel = () => {
  const { formatMessage } = useIntl()

  return (status: Import['status']) => {
    const statusDescriptor =
      messages[`importStatus${status}Label` as keyof typeof messages]

    return statusDescriptor ? formatMessage(statusDescriptor) : status
  }
}

export const useStockOptionLabel = () => {
  const { formatMessage } = useIntl()

  return (option: Import['stocksOption']) =>
    formatMessage(messages[`options${option}` as keyof typeof messages])
}

export const useEntityLabel = () => {
  const { formatMessage } = useIntl()

  return useCallback(
    (entity: string) =>
      formatMessage(
        messages[
          `importResults${entity.toUpperCase()}Label` as keyof typeof messages
        ]
      ),
    [formatMessage]
  )
}

export const goToHistoryPage = (id?: string) => {
  const queryId = id ? `?id=${id}` : ''

  window.parent.location.href = `/admin/catalog-importer/history${queryId}`
}

export const goToWizardPage = () => {
  window.parent.location.href = '/admin/catalog-importer/wizard'
}

export const goToWarehousePage = () => {
  window.parent.location.href = '/admin/shipping-strategy/warehouses'
}

type TreeSorterField = { name: string }
export const treeSorter = (a: TreeSorterField, b: TreeSorterField) =>
  a.name.localeCompare(b.name)

export const categoryTreeMapper: (category: Category) => Category = (
  category
) => ({
  ...category,
  children: category.children?.sort(treeSorter).map(categoryTreeMapper),
})

const treeNodeTheme = csx({
  '.tree, .tree-node, .tree-node-group': { listStyleType: 'none' },
  '.tree-node': { cursor: 'pointer' },
  '> .tree': {
    '> .tree-branch-wrapper, > .tree-leaf-list-item': {
      '> .tree-node > .name': { text: '$title1' },
      '.name': { lineHeight: 'var(--admin-ui-text-title1-lineHeight)' },
    },
  },
})

type NodeTree = { name: string }
type TreeProps<T extends NodeTree> = { data: T[]; title: string }
export const Tree = <T extends NodeTree>({ data, title }: TreeProps<T>) => {
  const children = useMemo(() => [{ name: title, children: data ?? [] }], [
    data,
    title,
  ])

  const folder = useMemo(() => flattenTree({ name: '', children }), [children])

  return (
    <div className={treeNodeTheme}>
      <TreeView
        data={folder}
        propagateCollapse
        nodeRenderer={({
          element,
          isBranch,
          isExpanded,
          getNodeProps,
          level,
          handleExpand,
        }) => {
          return (
            <Flex
              align="center"
              {...getNodeProps({ onClick: handleExpand })}
              style={{ marginLeft: 20 * (level - 1) }}
            >
              {!isBranch && level > 1 && (
                <IconCaretRight style={{ opacity: 0 }} />
              )}
              {isBranch && !isExpanded && <IconCaretRight />}
              {isBranch && isExpanded && <IconCaretDown />}
              <span className="name">{element.name}</span>
            </Flex>
          )
        }}
      />
    </div>
  )
}

type OnlyChildrenProp = React.PropsWithChildren<unknown>

export const ModalButtons = ({ children }: OnlyChildrenProp) => (
  <Stack
    className={csx({ marginTop: '$space-6' })}
    fluid
    space="$space-3"
    direction={{ mobile: 'column', tablet: 'row' }}
    align="end"
  >
    {children}
  </Stack>
)

export const threeColumnsUnits: ResponsiveProp<4 | 12> = {
  mobile: 12,
  tablet: 4,
}

export const twoColumnsUnits: ResponsiveProp<6 | 12> = {
  mobile: 12,
  tablet: 6,
}

export const notLastColumnTheme = csx({ marginBottom: '$space-4' })

export const FlexCenterResponsive = ({ children }: OnlyChildrenProp) => (
  <Flex justify={{ mobile: 'left', tablet: 'center' }}>{children}</Flex>
)

export const InputInlineWrapper = ({ children }: OnlyChildrenProp) => (
  <Flex
    className={csx({
      ' [data-wrap][data-space-inside]': {
        flexWrap: 'nowrap',
        alignItems: 'center',
      },
      ' [data-space-inside] > input:is(:first-child)': {
        marginLeft: 0,
        '&[type="checkbox"]': { minWidth: '2.25rem' },
        '&[type="radio"]': { minWidth: '1.25rem' },
      },
      ' [data-space-inside="true"] > input:is(:first-child)': {
        '&[type="checkbox"]': { minWidth: '1.25rem' },
      },
    })}
  >
    {children}
  </Flex>
)
