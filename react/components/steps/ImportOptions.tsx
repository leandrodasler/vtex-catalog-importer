import type { TabState } from '@vtex/admin-ui'
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Flex,
  IconArrowLeft,
  IconArrowRight,
  Radio,
  RadioGroup,
  Stack,
  TextInput,
  useRadioState,
} from '@vtex/admin-ui'
import React, { useState } from 'react'
import { useIntl } from 'react-intl'

import messages from '../../messages'

interface Props {
  state: TabState
  setOptionsChecked: (options: {
    checkedItems: string[]
    value: string
    stockOption: number
  }) => void
}

const STOCK_OPTIONS = {
  KEEP_SOURCE: 1,
  UNLIMITED: 2,
  TO_BE_DEFINED: 3,
}

export default function ImportOptions({ state, setOptionsChecked }: Props) {
  const { formatMessage } = useIntl()
  const stateSelect = useRadioState({ defaultValue: STOCK_OPTIONS.KEEP_SOURCE })
  const [value, setValue] = useState('')
  const [checkedItems, setCheckedItems] = useState<string[]>([
    formatMessage(messages.importImage),
    formatMessage(messages.importPrice),
  ])

  function handleCheck(item: string, isChecked: boolean) {
    let updatedCheckedItems = []

    if (isChecked) {
      updatedCheckedItems = [...checkedItems, item]
    } else {
      updatedCheckedItems = checkedItems.filter((i) => i !== item)
    }

    setCheckedItems(updatedCheckedItems)
  }

  const disabledNext =
    stateSelect.value === STOCK_OPTIONS.TO_BE_DEFINED && !value

  function handleSelectOptions() {
    setOptionsChecked({
      checkedItems,
      value,
      stockOption: stateSelect.value as number,
    })
  }

  return (
    <Stack space="$space-4" fluid>
      <CheckboxGroup label="" id="options-checkbox-group">
        <Checkbox
          value={formatMessage(messages.importImage)}
          label={formatMessage(messages.importImage)}
          checked={checkedItems.includes(formatMessage(messages.importImage))}
          onChange={(e) => handleCheck(e.target.value, e.target.checked)}
        />
        <Checkbox
          value={formatMessage(messages.importPrice)}
          label={formatMessage(messages.importPrice)}
          checked={checkedItems.includes(formatMessage(messages.importPrice))}
          onChange={(e) => handleCheck(e.target.value, e.target.checked)}
        />
      </CheckboxGroup>
      <RadioGroup
        state={stateSelect}
        label={formatMessage(messages.importStocks)}
      >
        <Radio
          value={STOCK_OPTIONS.KEEP_SOURCE}
          label={formatMessage(messages.optionsSource)}
        />
        <Radio
          value={STOCK_OPTIONS.UNLIMITED}
          label={formatMessage(messages.optionsUnlimited)}
        />
        <Radio
          value={STOCK_OPTIONS.TO_BE_DEFINED}
          label={formatMessage(messages.optionsDefined)}
        />
        {stateSelect.value === STOCK_OPTIONS.TO_BE_DEFINED && (
          <TextInput
            value={value}
            onChange={(e) => setValue(e.target.value)}
            type="number"
          />
        )}
      </RadioGroup>
      <Flex justify="space-between">
        <Button
          onClick={() => state.select(state.previous())}
          icon={<IconArrowLeft />}
        >
          {formatMessage(messages.previousLabel)}
        </Button>
        <Button
          onClick={() => {
            handleSelectOptions()
            state.select(state.next())
          }}
          icon={<IconArrowRight />}
          iconPosition="end"
          disabled={disabledNext}
        >
          {formatMessage(messages.nextLabel)}
        </Button>
      </Flex>
    </Stack>
  )
}
