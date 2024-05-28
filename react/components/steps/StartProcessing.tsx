import React from 'react'
import { useIntl } from 'react-intl'

import messages from '../../messages'

interface StartProcessingProps {
  checkedTreeOptions: { [key: string]: { checked: boolean; name: string } }
}

const StartProcessing = ({ checkedTreeOptions }: StartProcessingProps) => {
  const checkedCategories = Object.values(checkedTreeOptions)
    .filter((option) => option.checked)
    .map((option) => option.name)

  const { formatMessage } = useIntl()

  return (
    <div>
      <h3>{formatMessage(messages.optionsCategories)}</h3>

      {checkedCategories.map((categoryName, index) => (
        <div key={index}>{categoryName}</div>
      ))}
    </div>
  )
}

export default StartProcessing
