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
}

const STOCK_OPTIONS = {
  KEEP_SOURCE: 1,
  UNLIMITED: 2,
  TO_BE_DEFINED: 3,
}

export default function ImportOptions({ state }: Props) {
  const { formatMessage } = useIntl()
  const stateSelect = useRadioState({ defaultValue: STOCK_OPTIONS.KEEP_SOURCE })
  const [value, setValue] = useState('')
  const [checkedItems, setCheckedItems] = useState<string[]>([
    formatMessage(messages.optionsCheckbox1),
    formatMessage(messages.optionsCheckbox2),
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

  return (
    <Stack space="$space-4" fluid>
      <CheckboxGroup label="" id="options-checkbox-group">
        <Checkbox
          value={formatMessage(messages.optionsCheckbox1)}
          label={formatMessage(messages.optionsCheckbox1)}
          checked={checkedItems.includes(
            formatMessage(messages.optionsCheckbox1)
          )}
          onChange={(e) => handleCheck(e.target.value, e.target.checked)}
        />
        <Checkbox
          value={formatMessage(messages.optionsCheckbox2)}
          label={formatMessage(messages.optionsCheckbox2)}
          checked={checkedItems.includes(
            formatMessage(messages.optionsCheckbox2)
          )}
          onChange={(e) => handleCheck(e.target.value, e.target.checked)}
        />
      </CheckboxGroup>
      <RadioGroup
        state={stateSelect}
        label={formatMessage(messages.optionsCheckbox3)}
      >
        <Radio
          value={STOCK_OPTIONS.KEEP_SOURCE}
          label={formatMessage(messages.optionsRadio3)}
        />
        <Radio
          value={STOCK_OPTIONS.UNLIMITED}
          label={formatMessage(messages.optionsRadio1)}
        />
        <Radio
          value={STOCK_OPTIONS.TO_BE_DEFINED}
          label={formatMessage(messages.optionsRadio2)}
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
          onClick={() => state.select(state.next())}
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
