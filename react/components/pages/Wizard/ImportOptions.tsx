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
import React, { useCallback } from 'react'
import { useIntl } from 'react-intl'
import type { StocksOption } from 'ssesandbox04.catalog-importer'

import type { Options } from '.'
import { IMPORT_OPTIONS, STOCK_OPTIONS } from '.'
import { messages } from '../../common'

interface Props {
  state: TabState
  optionsChecked: Options
  setOptionsChecked: React.Dispatch<React.SetStateAction<Options>>
}

export default function ImportOptions({
  state,
  optionsChecked,
  setOptionsChecked,
}: Props) {
  const { formatMessage } = useIntl()
  const stockOptionState = useRadioState({
    defaultValue: optionsChecked.stockOption,
  })

  function handleCheck(item: number, isChecked: boolean) {
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
    stockOptionState.value === STOCK_OPTIONS.TO_BE_DEFINED &&
    !optionsChecked.value

  const handleSelectOptions = useCallback(() => {
    setOptionsChecked({
      ...optionsChecked,
      stockOption: stockOptionState.value as StocksOption,
    })
  }, [optionsChecked, setOptionsChecked, stockOptionState.value])

  return (
    <Stack space="$space-4" fluid>
      <CheckboxGroup label="" id="options-checkbox-group">
        <Checkbox
          value={IMPORT_OPTIONS.IMPORT_IMAGE}
          label={formatMessage(messages.importImage)}
          checked={optionsChecked.checkedItems.includes(
            IMPORT_OPTIONS.IMPORT_IMAGE
          )}
          onChange={(e: { target: { checked: boolean } }) =>
            handleCheck(IMPORT_OPTIONS.IMPORT_IMAGE, e.target.checked)
          }
        />
        <Checkbox
          value={IMPORT_OPTIONS.IMPORT_PRICE}
          label={formatMessage(messages.importPrice)}
          checked={optionsChecked.checkedItems.includes(
            IMPORT_OPTIONS.IMPORT_PRICE
          )}
          onChange={(e: { target: { checked: boolean } }) =>
            handleCheck(IMPORT_OPTIONS.IMPORT_PRICE, e.target.checked)
          }
        />
      </CheckboxGroup>
      <RadioGroup
        state={stockOptionState}
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
        {stockOptionState.value === STOCK_OPTIONS.TO_BE_DEFINED && (
          <TextInput
            value={optionsChecked.value}
            onChange={(e: { target: { value: string } }) =>
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
