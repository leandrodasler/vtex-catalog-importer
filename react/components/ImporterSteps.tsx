import {
  Card,
  Center,
  IconArrowLineDown,
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
              setCheckedTreeOptions={setCheckedTreeOptions}
            />
          )}
        </Suspense>
      </TabPanel>
      <TabPanel
        state={state}
        id="3"
        className={csx({ paddingTop: '$space-4' })}
      >
        <Suspense fallback={<Spinner />}>
          <ImportOptions state={state} />
        </Suspense>
      </TabPanel>
      <TabPanel
        state={state}
        id="4"
        className={csx({ paddingTop: '$space-4' })}
      >
        <Suspense fallback={<Spinner />}>
          <StartProcessing
            checkedTreeOptions={checkedTreeOptions}
            state={state}
          />
        </Suspense>
      </TabPanel>
    </Card>
  )
}
