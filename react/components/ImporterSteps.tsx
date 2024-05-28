import {
  Button,
  Card,
  Center,
  Flex,
  IconArrowLeft,
  IconArrowLineDown,
  IconArrowRight,
  IconFaders,
  IconGear,
  IconListDashes,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  csx,
  useTabState,
  useToast,
} from '@vtex/admin-ui'
import React, { Suspense, lazy, useState } from 'react'
import { useQuery } from 'react-apollo'
import { useIntl } from 'react-intl'
import type { AppSettingsInput, Query } from 'ssesandbox04.catalog-importer'

import APP_SETTINGS_QUERY from '../graphql/appSettings.graphql'
import messages from '../messages'

const Settings = lazy(() => import('./steps/Settings'))
const CategoryTree = lazy(() => import('./steps/CategoryTree'))
const ImportOptions = lazy(() => import('./steps/ImportOptions'))
const StartProcessing = lazy(() => import('./steps/StartProcessing'))

const SuspenseFallback = () => (
  <Center>
    <Spinner />
  </Center>
)

export default function ImporterSteps() {
  const state = useTabState()
  const { formatMessage } = useIntl()
  const showToast = useToast()
  const [settings, setSettings] = useState<AppSettingsInput>()
  // const [checked, setChecked] = useState(false)
  const [checkedSecondStep, setCheckedSecondStep] = useState(false)
  const [checkedTreeOptions, setCheckedTreeOptions] = useState({})

  const { loading } = useQuery<Query>(APP_SETTINGS_QUERY, {
    notifyOnNetworkStatusChange: true,
    onError(error) {
      showToast({
        title: formatMessage(messages.settingsError),
        message: error.message,
        variant: 'critical',
      })
    },
    onCompleted(data) {
      setSettings(data.appSettings)
    },
  })

  return (
    <Card>
      <TabList state={state} className={csx({ bg: '$secondary' })}>
        <Tab id="1" className={csx({ bg: '$secondary' })}>
          <Center>
            <IconGear className="mr1" size="small" />
            {formatMessage(messages.settingsLabel)}
          </Center>
        </Tab>
        <Tab
          disabled={state.activeId === '1'}
          id="2"
          className={csx({ bg: '$secondary' })}
        >
          <Center>
            <IconListDashes className="mr1" size="small" />
            {formatMessage(messages.categoriesLabel)}
          </Center>
        </Tab>
        <Tab
          disabled={state.activeId === '1' || state.activeId === '2'}
          id="3"
          className={csx({ bg: '$secondary' })}
        >
          <Center>
            <IconFaders className="mr1" size="small" />
            {formatMessage(messages.optionsLabel)}
          </Center>
        </Tab>
        <Tab
          disabled={
            state.activeId === '1' ||
            state.activeId === '2' ||
            state.activeId === '3'
          }
          id="4"
          className={csx({ bg: '$secondary' })}
        >
          <Center>
            <IconArrowLineDown className="mr1" size="small" />
            {formatMessage(messages.startLabel)}
          </Center>
        </Tab>
      </TabList>
      <TabPanel
        state={state}
        id="1"
        hidden={state.activeId !== '1'}
        className={csx({ padding: '$space-4' })}
      >
        <Suspense fallback={<SuspenseFallback />}>
          {state.activeId === '1' &&
            (loading ? (
              <SuspenseFallback />
            ) : (
              <Settings
                state={state}
                settings={settings}
                setSettings={setSettings}
              />
            ))}
        </Suspense>
      </TabPanel>
      <TabPanel
        state={state}
        id="2"
        hidden={state.activeId !== '2'}
        className={csx({ padding: '$space-4' })}
      >
        <Suspense fallback={<SuspenseFallback />}>
          {state.activeId === '2' && (
            <CategoryTree
              state={state}
              settings={settings}
              // checked={checked}
              // setChecked={setChecked}
              setCheckedTreeOptions={setCheckedTreeOptions}
            />
          )}
        </Suspense>
        {/* <Suspense fallback={<Spinner />}>
          <CategoryTree
            state={state}
            settings={settings}
            setChecked={setChecked}
            setCheckedTreeOptions={setCheckedTreeOptions}
          />
        </Suspense> */}
        {/* <Flex
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
        </Flex> */}
      </TabPanel>
      <TabPanel
        state={state}
        id="3"
        className={csx({ bg: '$secondary', paddingTop: '$space-4' })}
      >
        <Suspense fallback={<Spinner />}>
          <ImportOptions setChecked={setCheckedSecondStep} />
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
            disabled={!checkedSecondStep}
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
        <Suspense fallback={<Spinner />}>
          <StartProcessing checkedTreeOptions={checkedTreeOptions} />
        </Suspense>
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
    </Card>
  )
}
