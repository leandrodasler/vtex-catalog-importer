import { Stack, Tag, Text } from '@vtex/admin-ui'
import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'
import type { Import } from 'ssesandbox04.catalog-importer'
import { useRuntime } from 'vtex.render-runtime'

import { getFinishedAt, getStartedAt } from '.'
import {
  Checked,
  Tree,
  Unchecked,
  categoryTreeMapper,
  messages,
  treeSorter,
  useStatusLabel,
  useStockOptionLabel,
} from '../../../common'
import { mapStatusToVariant } from '../useImportColumns'

type Props = { currentImport: Import }

export const ImportDetails = ({ currentImport }: Props) => {
  const {
    culture: { locale },
  } = useRuntime()

  const { formatMessage } = useIntl()
  const getStockOptionLabel = useStockOptionLabel()
  const getStatusLabel = useStatusLabel()
  const { createdIn, lastInteractionIn, status } = currentImport

  const categoryTree = useMemo(
    () =>
      currentImport?.categoryTree.sort(treeSorter).map(categoryTreeMapper) ??
      [],
    [currentImport?.categoryTree]
  )

  const startedAt = useMemo(() => getStartedAt(createdIn, locale), [
    createdIn,
    locale,
  ])

  const finishedAt = useMemo(
    () => getFinishedAt(lastInteractionIn, locale, status),
    [lastInteractionIn, status, locale]
  )

  return (
    <Stack space="$space-2" fluid>
      <section>
        <Text variant="title1">
          {formatMessage(messages.importStatusLabel)}:{' '}
        </Text>
        <Tag
          label={getStatusLabel(currentImport.status)}
          variant={mapStatusToVariant[currentImport.status]}
        />
      </section>
      <section>
        <Text variant="title1">
          {formatMessage(messages.importCreatedInLabel)}:{' '}
        </Text>
        {startedAt}
      </section>
      <section>
        <Text variant="title1">
          {formatMessage(messages.importLastInteractionInLabel)}:{' '}
        </Text>
        {finishedAt}
      </section>
      <section>
        <Text variant="title1">
          {formatMessage(messages.settingsAccountLabel)}:{' '}
        </Text>
        {currentImport.settings.useDefault
          ? formatMessage(messages.settingsDefaultShort)
          : currentImport.settings.account}
      </section>
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
  )
}
