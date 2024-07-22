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
const resultDetailTheme = cx(resultSkeletonTheme, csx({ padding: '$space-05' }))
const totalizerTheme = csx({
  lineHeight: 'var(--admin-ui-text-title1-lineHeight)',
})

const ImportEntityResult = ({ title, current, total, loading }: Props) => {
  const { percentage, localePercentage } = useLocalePercentage(current, total)

  return (
    <section>
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
          <Text variant="title1">{title}: </Text>
          <span className={totalizerTheme}>
            {current} / {total} - {localePercentage}
          </span>
        </Inline>
      </Card>
    </section>
  )
}

export default ImportEntityResult
