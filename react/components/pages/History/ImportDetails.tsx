import {
  Button,
  csx,
  IconCaretDown,
  IconCaretRight,
  Stack,
  Text,
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

const toggleButtonTheme = csx({
  '[data-size="normal"]': { paddingLeft: 0, marginY: '$space-2' },
})

const ImportDetails = ({ currentImport }: Props) => {
  const { formatMessage } = useIntl()
  const { getStartedAt, getFinishedAt } = useLocaleDate()
  const getStockOptionLabel = useStockOptionLabel()
  const { getToggleProps, getCollapseProps, visible } = useCollapse()

  const categoryTree = useMemo(
    () =>
      currentImport?.categoryTree.sort(treeSorter).map(categoryTreeMapper) ??
      [],
    [currentImport?.categoryTree]
  )

  return (
    <>
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
      </Stack>
      <Button
        className={toggleButtonTheme}
        variant="tertiary"
        icon={visible ? <IconCaretDown /> : <IconCaretRight />}
        {...getToggleProps()}
      >
        {visible
          ? formatMessage(messages.showLessLabel)
          : formatMessage(messages.showMoreLabel)}
      </Button>
      <Stack space="$space-2" fluid {...getCollapseProps()}>
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
        {categoryTree.length && (
          <section>
            <Tree
              data={categoryTree}
              title={formatMessage(messages.optionsCategories)}
            />
          </section>
        )}
      </Stack>
    </>
  )
}

export default ImportDetails
