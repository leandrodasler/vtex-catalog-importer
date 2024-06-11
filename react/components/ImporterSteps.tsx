import {
  Card,
  Center,
  IconArrowLineDown,
  IconFaders,
  IconGear,
  IconListDashes,
  Tab,
  TabList,
  TabPanel,
  csx,
  useTabState,
} from '@vtex/admin-ui'
import React, { Suspense, lazy, useState } from 'react'
import { useIntl } from 'react-intl'
import type { AppSettingsInput } from 'ssesandbox04.catalog-importer'

import { APP_SETTINGS_QUERY, useQueryCustom } from '../graphql'
import messages from '../messages'
import { ErrorMessage, SuspenseFallback } from './common'

const Settings = lazy(() => import('./steps/Settings'))
const CategoryTree = lazy(() => import('./steps/CategoryTree'))
const ImportOptions = lazy(() => import('./steps/ImportOptions'))
const StartProcessing = lazy(() => import('./steps/StartProcessing'))

export interface CheckedCategories {
  [key: string]: { checked: boolean; name: string }
}

const tabListTheme = csx({
  bg: '$secondary',
  '> [data-wrap="true"][data-space-inside="true"]': {
    flexFlow: 'column',
    '@tablet': { flexFlow: 'row' },
    '> button': {
      bg: '$secondary',
      width: '100%',
      marginLeft: 0,
      '@tablet': { width: 'auto', marginLeft: '$space-1' },
    },
  },
})

const tabPanelTheme = csx({ padding: '$space-4' })

export default function ImporterSteps() {
  const state = useTabState({
    focusLoop: false,
    selectOnMove: false,
  })

  const [optionsChecked, setOptionsChecked] = useState<{
    checkedItems: string[]
    value: string
    stockOption: number
  }>({
    checkedItems: [],
    value: '',
    stockOption: 1,
  })

  const { formatMessage } = useIntl()
  const [settings, setSettings] = useState<AppSettingsInput>()
  const [
    checkedTreeOptions,
    setCheckedTreeOptions,
  ] = useState<CheckedCategories>({})

  const { loading, error } = useQueryCustom(APP_SETTINGS_QUERY, {
    toastError: false,
    onCompleted(data) {
      setSettings(data.appSettings)
    },
  })

  return (
    <Card>
      <TabList state={state} className={tabListTheme}>
        <Tab id="1">
          <Center>
            <IconGear className="mr1" size="small" />
            {formatMessage(messages.settingsLabel)}
          </Center>
        </Tab>
        <Tab disabled={state.selectedId === '1'} id="2">
          <Center>
            <IconListDashes className="mr1" size="small" />
            {formatMessage(messages.categoriesLabel)}
          </Center>
        </Tab>
        <Tab
          disabled={state.selectedId === '1' || state.selectedId === '2'}
          id="3"
        >
          <Center>
            <IconFaders className="mr1" size="small" />
            {formatMessage(messages.optionsLabel)}
          </Center>
        </Tab>
        <Tab
          disabled={
            state.selectedId === '1' ||
            state.selectedId === '2' ||
            state.selectedId === '3'
          }
          id="4"
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
        hidden={state.selectedId !== '1'}
        className={tabPanelTheme}
      >
        <Suspense fallback={<SuspenseFallback />}>
          {state.selectedId === '1' && loading && <SuspenseFallback />}
          {state.selectedId === '1' && error && (
            <ErrorMessage error={error} title={messages.settingsError} />
          )}
          {state.selectedId === '1' && !loading && !error && (
            <Settings
              state={state}
              settings={settings}
              setSettings={setSettings}
              setCheckedTreeOptions={setCheckedTreeOptions}
            />
          )}
        </Suspense>
      </TabPanel>
      <TabPanel
        state={state}
        id="2"
        hidden={state.selectedId !== '2'}
        className={tabPanelTheme}
      >
        <Suspense fallback={<SuspenseFallback />}>
          {state.selectedId === '2' && (
            <CategoryTree
              state={state}
              settings={settings}
              checkedTreeOptions={checkedTreeOptions}
              setCheckedTreeOptions={setCheckedTreeOptions}
            />
          )}
        </Suspense>
      </TabPanel>
      <TabPanel
        state={state}
        id="3"
        hidden={state.selectedId !== '3'}
        className={tabPanelTheme}
      >
        <Suspense fallback={<SuspenseFallback />}>
          {state.selectedId === '3' && (
            <ImportOptions
              state={state}
              setOptionsChecked={setOptionsChecked}
            />
          )}
        </Suspense>
      </TabPanel>
      <TabPanel
        state={state}
        id="4"
        hidden={state.selectedId !== '4'}
        className={tabPanelTheme}
      >
        <Suspense fallback={<SuspenseFallback />}>
          {state.selectedId === '4' && (
            <StartProcessing
              checkedTreeOptions={checkedTreeOptions}
              optionsChecked={optionsChecked}
              state={state}
            />
          )}
        </Suspense>
      </TabPanel>
    </Card>
  )
}
