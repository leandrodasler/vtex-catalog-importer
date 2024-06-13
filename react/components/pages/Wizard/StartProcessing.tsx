import type { TabState } from '@vtex/admin-ui'
import {
  Button,
  Flex,
  IconArrowLeft,
  IconArrowLineDown,
  csx,
} from '@vtex/admin-ui'
import React from 'react'
import { useIntl } from 'react-intl'

import { IMPORT_OPTIONS, STOCK_OPTIONS } from '.'
import { messages } from '../../common'

interface StartProcessingProps {
  checkedTreeOptions: { [key: string]: { checked: boolean; name: string } }
  optionsChecked: { checkedItems: number[]; value: string; stockOption: number }
  state: TabState
}

const StartProcessing = ({
  checkedTreeOptions,
  optionsChecked,
  state,
}: StartProcessingProps) => {
  const checkedCategories = Object.values(checkedTreeOptions)
    .filter((option) => option.checked)
    .map((option) => option.name)

  const { formatMessage } = useIntl()

  return (
    <Flex style={{ flexDirection: 'column' }}>
      <h3>{formatMessage(messages.optionsCategories)}</h3>
      {checkedCategories.map((categoryName, index) => (
        <div key={index}>{categoryName}</div>
      ))}
      <h3>{formatMessage(messages.optionsLabel)}</h3>
      <div>
        {formatMessage(messages.importImage)}:{' '}
        {optionsChecked.checkedItems.includes(IMPORT_OPTIONS.IMPORT_IMAGE)
          ? formatMessage(messages.yesLabel)
          : formatMessage(messages.noLabel)}
      </div>
      <div>
        {formatMessage(messages.importPrice)}:{' '}
        {optionsChecked.checkedItems.includes(IMPORT_OPTIONS.IMPORT_PRICE)
          ? formatMessage(messages.yesLabel)
          : formatMessage(messages.noLabel)}
      </div>
      <div>
        {formatMessage(messages.importStocks)}:{' '}
        {optionsChecked.stockOption === STOCK_OPTIONS.KEEP_SOURCE ? (
          formatMessage(messages.optionsSource)
        ) : optionsChecked.stockOption === STOCK_OPTIONS.UNLIMITED ? (
          formatMessage(messages.optionsUnlimited)
        ) : (
          <>
            {formatMessage(messages.optionsDefined)}: {optionsChecked.value}
          </>
        )}
      </div>
      <Flex justify="space-between" className={csx({ marginTop: '$space-4' })}>
        <Button
          onClick={() => state.select(state.previous())}
          icon={<IconArrowLeft />}
        >
          {formatMessage(messages.previousLabel)}
        </Button>
        <Button icon={<IconArrowLineDown />}>
          {formatMessage(messages.startLabel)}
        </Button>
      </Flex>
    </Flex>
  )
}

export default StartProcessing
