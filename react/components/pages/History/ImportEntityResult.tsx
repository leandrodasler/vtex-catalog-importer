import { Card, csx, cx, Inline, Text } from '@vtex/admin-ui'
import React from 'react'

import { Checked, Loading, Unchecked } from '../../common'
import { EntitySkeleton, useLocalePercentage } from './common'

type Props = { title: string; current: number; total: number; loading: boolean }

const resultCardTheme = csx({
  position: 'relative',
  height: 32,
  overflow: 'hidden',
})

const resultSkeletonTheme = csx({ width: '100%', position: 'absolute' })
const resultDetailTheme = cx(resultSkeletonTheme, csx({ paddingY: '$space-1' }))

const ImportEntityResult = ({ title, current, total, loading }: Props) => {
  const { percentage, localePercentage } = useLocalePercentage(current, total)

  return (
    <Card className={resultCardTheme}>
      {current < total && (
        <div className={resultSkeletonTheme}>
          <EntitySkeleton width={`${percentage}%`} />
        </div>
      )}
      <Inline align="center" className={resultDetailTheme}>
        {!!current && current === total && <Checked />}
        {(!current || current !== total) && loading && <Loading />}
        {(!current || current !== total) && !loading && <Unchecked />}
        <Text variant="action1">{title}: </Text>
        <Text>
          {current} / {total} - {localePercentage}
        </Text>
      </Inline>
    </Card>
  )
}

export default ImportEntityResult
