import {
  Button,
  Flex,
  IconArrowLeft,
  IconArrowLineDown,
  IconArrowRight,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  csx,
  useTabState,
} from '@vtex/admin-ui'
import React, { Suspense, lazy, useState } from 'react'
import { useIntl } from 'react-intl'

import messages from '../messages'

const CategoryTree = lazy(() => import('./steps/CategoryTree'))
const ImportOptions = lazy(() => import('./steps/ImportOptions'))

export default function ImporterSteps() {
  const state = useTabState()
  const { formatMessage } = useIntl()
  const [checked, setChecked] = useState(false)

  return (
    <div>
      <TabList state={state}>
        <Tab id="1">{formatMessage(messages.settingsLabel)}</Tab>
        <Tab disabled={state.activeId === '1'} id="2">
          {formatMessage(messages.categoriesLabel)}
        </Tab>
        <Tab disabled={state.activeId === '1' || state.activeId === '2'} id="3">
          {formatMessage(messages.optionsLabel)}
        </Tab>
        <Tab
          disabled={
            state.activeId === '1' ||
            state.activeId === '2' ||
            state.activeId === '3'
          }
          id="4"
        >
          {formatMessage(messages.startLabel)}
        </Tab>
      </TabList>
      <TabPanel
        state={state}
        id="1"
        className={csx({ bg: '$secondary', paddingTop: '$space-4' })}
      >
        Conteúdo 1
        <Flex justify="end" className={csx({ marginTop: '$space-4' })}>
          <Button
            onClick={() => state.select('2')}
            icon={<IconArrowRight />}
            iconPosition="end"
          >
            {formatMessage(messages.nextLabel)}
          </Button>
        </Flex>
      </TabPanel>
      <TabPanel
        state={state}
        id="2"
        className={csx({ bg: '$secondary', paddingTop: '$space-4' })}
      >
        <Suspense fallback={<Spinner />}>
          <CategoryTree setChecked={setChecked} />
        </Suspense>
        <Flex
          justify="space-between"
          className={csx({ marginTop: '$space-4' })}
        >
          <Button onClick={() => state.select('1')} icon={<IconArrowLeft />}>
            {formatMessage(messages.previousLabel)}
          </Button>
          <Button
            onClick={() => state.select('3')}
            icon={<IconArrowRight />}
            iconPosition="end"
            disabled={!checked}
          >
            {formatMessage(messages.nextLabel)}
          </Button>
        </Flex>
      </TabPanel>
      <TabPanel
        state={state}
        id="3"
        className={csx({ bg: '$secondary', paddingTop: '$space-4' })}
      >
        <Suspense fallback={<Spinner />}>
          <ImportOptions />
        </Suspense>
        <Flex
          justify="space-between"
          className={csx({ marginTop: '$space-4' })}
        >
          <Button onClick={() => state.select('2')} icon={<IconArrowLeft />}>
            {formatMessage(messages.previousLabel)}
          </Button>
          <Button
            onClick={() => state.select('4')}
            icon={<IconArrowRight />}
            iconPosition="end"
          >
            {formatMessage(messages.nextLabel)}
          </Button>
        </Flex>
      </TabPanel>
      <TabPanel
        state={state}
        id="4"
        className={csx({ bg: '$secondary', paddingTop: '$space-4' })}
      >
        Conteúdo 4
        <Flex
          justify="space-between"
          className={csx({ marginTop: '$space-4' })}
        >
          <Button onClick={() => state.select('3')} icon={<IconArrowLeft />}>
            {formatMessage(messages.previousLabel)}
          </Button>
          <Button icon={<IconArrowLineDown />}>
            {formatMessage(messages.startLabel)}
          </Button>
        </Flex>
      </TabPanel>
    </div>
  )
}
