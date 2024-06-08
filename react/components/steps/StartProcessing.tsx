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

import messages from '../../messages'

interface StartProcessingProps {
  checkedTreeOptions: { [key: string]: { checked: boolean; name: string } }
  state: TabState
}

const StartProcessing = ({
  checkedTreeOptions,
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
