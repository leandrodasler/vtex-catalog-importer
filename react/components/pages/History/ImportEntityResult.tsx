import { Card, csx, cx, Inline, Text } from '@vtex/admin-ui'
import React, { useMemo } from 'react'

import { Checked, Loading, Unchecked } from '../../common'
import { EntitySkeleton, useLocalePercentage } from './common'

type Props = { title: string; current: number; total: number; loading: boolean }

const resultCardTheme = csx({ position: 'relative', height: 32 })
const resultSkeletonTheme = csx({ width: '100%', position: 'absolute' })
const resultDetailTheme = cx(resultSkeletonTheme, csx({ padding: '$space-05' }))
const totalizerTheme = csx({
  lineHeight: 'var(--admin-ui-text-title1-lineHeight)',
})

const ImportEntityResult = ({ title, current, total, loading }: Props) => {
  const getPercentage = useLocalePercentage()

  const percentage = useMemo(
    () => (total ? getPercentage(current / total) : '0%'),
    [current, getPercentage, total]
  )

  return (
    <section>
      <Card className={resultCardTheme}>
        {percentage !== '100%' && (
          <div className={resultSkeletonTheme}>
            <EntitySkeleton width={percentage} />
          </div>
        )}
        <Inline align="center" className={resultDetailTheme}>
          {percentage === '100%' && <Checked />}
          {percentage !== '100%' && loading && <Loading />}
          {percentage !== '100%' && !loading && <Unchecked />}
          <Text variant="title1">{title}: </Text>
          <span className={totalizerTheme}>
            {current} / {total}
          </span>
        </Inline>
      </Card>
    </section>
  )
}

export default ImportEntityResult
