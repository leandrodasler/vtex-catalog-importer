import {
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  TextInput,
  useRadioState,
} from '@vtex/admin-ui'
import React, { useState } from 'react'
import { useIntl } from 'react-intl'

import messages from '../../messages'

interface Props {
  setChecked: (checked: boolean) => void
}

export default function ImportOptions({ setChecked }: Props) {
  const { formatMessage } = useIntl()
  const state = useRadioState({ defaultValue: '' })
  const [value, setValue] = useState('')
  const [checkedItems, setCheckedItems] = useState<string[]>([])

  function handleCheck(item: string, isChecked: boolean) {
    let updatedCheckedItems = []

    if (isChecked) {
      updatedCheckedItems = [...checkedItems, item]
    } else {
      updatedCheckedItems = checkedItems.filter((i) => i !== item)
    }

    setCheckedItems(updatedCheckedItems)
    setChecked(updatedCheckedItems.length > 0)
  }

  const isStockSelected = checkedItems.includes('Estoques')

  return (
    <div>
      <CheckboxGroup label="" id="options-checkbox-group">
        <Checkbox
          value={formatMessage(messages.optionsCheckbox1)}
          label={formatMessage(messages.optionsCheckbox1)}
          onChange={(e) => handleCheck(e.target.value, e.target.checked)}
        />
        <Checkbox
          value={formatMessage(messages.optionsCheckbox2)}
          label={formatMessage(messages.optionsCheckbox2)}
          onChange={(e) => handleCheck(e.target.value, e.target.checked)}
        />
        <Checkbox
          value={formatMessage(messages.optionsCheckbox3)}
          label={formatMessage(messages.optionsCheckbox3)}
          onChange={(e) => handleCheck(e.target.value, e.target.checked)}
        />
      </CheckboxGroup>
      <RadioGroup
        state={state}
        aria-label="radio-group"
        label=""
        style={{ marginLeft: 40, marginTop: 20 }}
      >
        <Radio
          value="1"
          label="copiar valor da conta de origem"
          disabled={!isStockSelected}
        />
        <Radio
          value="2"
          label="informar valor (para todos)"
          disabled={!isStockSelected}
        />
        {state.value === '2' && (
          <div style={{ marginLeft: 40 }}>
            <TextInput
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        )}
        <Radio
          value="3"
          label="estoque infinito (para todos)"
          disabled={!isStockSelected}
        />
      </RadioGroup>
    </div>
  )
}
