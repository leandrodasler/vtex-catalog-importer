import {
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  TextInput,
  useRadioState,
} from '@vtex/admin-ui'
import React, { useState } from 'react'

export default function ImportOptions() {
  const state = useRadioState({ defaultValue: 'radio-1' })
  const [value, setValue] = useState('')

  // eslint-disable-next-line no-console
  console.log('state', state.value)
  const values = React.useMemo(
    () => ['Importar ou não imagens', 'Importar ou não preços', 'Estoques'],
    []
  )

  return (
    <div>
      <CheckboxGroup label="" id="fruits-checkbox-group">
        {values.map((fruit, key) => (
          <Checkbox value={fruit} label={fruit} key={key} />
        ))}
      </CheckboxGroup>
      <RadioGroup
        state={state}
        aria-label="radio-group"
        label=""
        style={{ marginLeft: 40, marginTop: 20 }}
      >
        <Radio value="1" label="copiar valor da conta de origem" />
        <Radio value="2" label="informar valor (para todos)" />
        {state.value === '2' && (
          <div style={{ marginLeft: 40 }}>
            <TextInput
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        )}
        <Radio value="3" label="estoque infinito (para todos)" />
      </RadioGroup>
    </div>
  )
}
