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
import React from 'react'
import { useIntl } from 'react-intl'

import messages from '../../messages'
import type { Options } from '../ImporterSteps'

interface Props {
  state: TabState
  optionsChecked: Options
  setOptionsChecked: React.Dispatch<React.SetStateAction<Options>>
}

export const STOCK_OPTIONS = {
  KEEP_SOURCE: 1,
  UNLIMITED: 2,
  TO_BE_DEFINED: 3,
}

export default function ImportOptions({
  state,
  optionsChecked,
  setOptionsChecked,
}: Props) {
  const { formatMessage } = useIntl()
  const stateSelect = useRadioState({
    defaultValue: optionsChecked.stockOption,
  })

  function handleCheck(item: string, isChecked: boolean) {
    let updatedCheckedItems = []

    if (isChecked) {
      updatedCheckedItems = [...optionsChecked.checkedItems, item]
    } else {
      updatedCheckedItems = optionsChecked.checkedItems.filter(
        (i) => i !== item
      )
    }

    setOptionsChecked({
      ...optionsChecked,
      checkedItems: updatedCheckedItems,
    })
  }

  const disabledNext =
    stateSelect.value === STOCK_OPTIONS.TO_BE_DEFINED && !optionsChecked.value

  function handleSelectOptions() {
    setOptionsChecked({
      ...optionsChecked,
      stockOption: stateSelect.value as number,
    })
  }

  return (
    <Stack space="$space-4" fluid>
      <CheckboxGroup label="" id="options-checkbox-group">
        <Checkbox
          value={formatMessage(messages.importImage)}
          label={formatMessage(messages.importImage)}
          checked={optionsChecked.checkedItems.includes(
            formatMessage(messages.importImage)
          )}
          onChange={(e) => handleCheck(e.target.value, e.target.checked)}
        />
        <Checkbox
          value={formatMessage(messages.importPrice)}
          label={formatMessage(messages.importPrice)}
          checked={optionsChecked.checkedItems.includes(
            formatMessage(messages.importPrice)
          )}
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
            value={optionsChecked.value}
            onChange={(e) =>
              setOptionsChecked({
                ...optionsChecked,
                value: e.target.value,
              })
            }
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
