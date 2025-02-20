import {
  Button,
  IconCaretDown,
  IconCaretUp,
  Stack,
  Text,
  useBreakpoint,
  useCollapse,
} from '@vtex/admin-ui'
import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'
import type { Import } from 'ssesandbox04.catalog-importer'

import {
  categoryTreeMapper,
  Checked,
  messages,
  Tree,
  treeSorter,
  Unchecked,
  useStockOptionLabel,
} from '../../common'
import { useLocaleDate } from './common'

type Props = { currentImport: Import }

const ImportDetails = ({ currentImport }: Props) => {
  const { formatMessage } = useIntl()
  const { getStartedAt, getFinishedAt } = useLocaleDate()
  const { breakpoint } = useBreakpoint()
  const { getToggleProps, getCollapseProps, visible } = useCollapse()
  const getStockOptionLabel = useStockOptionLabel()

  const categoryTree = useMemo(
    () =>
      currentImport?.categoryTree.sort(treeSorter).map(categoryTreeMapper) ??
      [],
    [currentImport?.categoryTree]
  )

  return (
    <Stack space="$space-2" fluid>
      <section>
        <Text variant="title1">
          {formatMessage(messages.importCreatedInLabel)}:{' '}
        </Text>
        {getStartedAt(currentImport.createdIn)}
      </section>
      <section>
        <Text variant="title1">
          {formatMessage(messages.importLastInteractionInLabel)}:{' '}
        </Text>
        {getFinishedAt(currentImport.lastInteractionIn, currentImport.status)}
      </section>
      <section>
        <Text variant="title1">
          {formatMessage(messages.settingsAccountLabel)}:{' '}
        </Text>
        {currentImport.settings.useDefault
          ? formatMessage(messages.settingsDefaultShort)
          : currentImport.settings.account}
      </section>
      {breakpoint === 'mobile' && (
        <Button
          variant="tertiary"
          icon={visible ? <IconCaretUp /> : <IconCaretDown />}
          {...getToggleProps()}
        >
          {visible
            ? formatMessage(messages.showLessLabel)
            : formatMessage(messages.showMoreLabel)}
        </Button>
      )}
      <Stack
        space="$space-2"
        fluid
        {...(breakpoint === 'mobile' && getCollapseProps())}
      >
        <section>
          <Text variant="title1">ID: </Text>
          {currentImport.id}
        </section>
        <section>
          <Text variant="title1">
            {formatMessage(messages.importUserLabel)}:{' '}
          </Text>
          {currentImport.user}
        </section>
        <section>
          <Stack direction="row">
            <Text variant="title1">{formatMessage(messages.importImage)}</Text>
            {currentImport.importImages ? <Checked /> : <Unchecked />}
          </Stack>
        </section>
        <section>
          <Stack direction="row">
            <Text variant="title1">{formatMessage(messages.importPrice)}</Text>
            {currentImport.importPrices ? <Checked /> : <Unchecked />}
          </Stack>
        </section>
        <section>
          <Text variant="title1">{formatMessage(messages.importStocks)}: </Text>
          {getStockOptionLabel(currentImport.stocksOption)}
        </section>
        {currentImport.stocksOption === 'TO_BE_DEFINED' && (
          <section>
            <Text variant="title1">{formatMessage(messages.stockValue)}: </Text>
            {currentImport.stockValue}
          </section>
        )}
        <section>
          <Text variant="title1">
            {formatMessage(messages.targetWarehouse)}:{' '}
          </Text>
          {currentImport.targetWarehouse}
        </section>
        {categoryTree.length && (
          <section>
            <Tree
              data={categoryTree}
              title={formatMessage(messages.optionsCategories)}
            />
          </section>
        )}
      </Stack>
    </Stack>
  )
}

export default ImportDetails
