import type { NumberInputValue } from '@vtex/admin-ui'
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
import React, { Suspense, lazy, useCallback, useState } from 'react'
import { useIntl } from 'react-intl'
import type {
  AppSettingsInput,
  Category,
  StocksOption,
} from 'ssesandbox04.catalog-importer'

import { ErrorMessage, SuspenseFallback, messages } from '../../common'
import { APP_SETTINGS_QUERY, useQueryCustom } from '../../graphql'

const Settings = lazy(() => import('./Settings'))
const CategoryTree = lazy(() => import('./CategoryTree'))
const ImportOptions = lazy(() => import('./ImportOptions'))
const StartProcessing = lazy(() => import('./StartProcessing'))

export type CheckedCategory = Category & {
  checked: boolean
  isRoot?: boolean
  parentId: string
  children?: CheckedCategory[]
}

export interface CheckedCategories {
  [key: string]: CheckedCategory
}

export interface Options {
  checkedItems: number[]
  value: NumberInputValue
  stockOption: StocksOption
}

export const STOCK_OPTIONS: Record<string, StocksOption> = {
  KEEP_SOURCE: 'KEEP_SOURCE',
  UNLIMITED: 'UNLIMITED',
  TO_BE_DEFINED: 'TO_BE_DEFINED',
}

export const IMPORT_OPTIONS = {
  IMPORT_IMAGE: 1,
  IMPORT_PRICE: 2,
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
      '@tablet': {
        width: 'auto',
        '&:not(:first-child)': { marginLeft: '$space-1' },
      },
    },
  },
})

const tabPanelTheme = csx({ padding: '$space-4' })

export default function Wizard() {
  const { formatMessage } = useIntl()
  const state = useTabState({
    focusLoop: false,
    selectOnMove: false,
  })

  const [settings, setSettings] = useState<AppSettingsInput>()

  const [
    checkedTreeOptions,
    setCheckedTreeOptions,
  ] = useState<CheckedCategories>({})

  const [optionsChecked, setOptionsChecked] = useState<Options>({
    checkedItems: [IMPORT_OPTIONS.IMPORT_IMAGE, IMPORT_OPTIONS.IMPORT_PRICE],
    value: '',
    stockOption: STOCK_OPTIONS.KEEP_SOURCE,
  })

  const [successImport, setSuccessImport] = useState(false)

  const { loading, error } = useQueryCustom(APP_SETTINGS_QUERY, {
    toastError: false,
    onCompleted(data) {
      setSettings(data.appSettings)
    },
  })

  const selectedId = state.selectedId ?? ''

  const isStepDisabled = useCallback(
    (steps: string[]) => successImport || steps.includes(selectedId),
    [selectedId, successImport]
  )

  return (
    <Card>
      <TabList state={state} className={tabListTheme}>
        <Tab id="1" disabled={successImport}>
          <Center>
            <IconGear className="mr1" size="small" />
            {formatMessage(messages.settingsLabel)}
          </Center>
        </Tab>
        <Tab disabled={isStepDisabled(['1'])} id="2">
          <Center>
            <IconListDashes className="mr1" size="small" />
            {formatMessage(messages.categoriesLabel)}
          </Center>
        </Tab>
        <Tab disabled={isStepDisabled(['1', '2'])} id="3">
          <Center>
            <IconFaders className="mr1" size="small" />
            {formatMessage(messages.optionsLabel)}
          </Center>
        </Tab>
        <Tab disabled={isStepDisabled(['1', '2', '3'])} id="4">
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
        <Suspense key="step-1" fallback={<SuspenseFallback />}>
          {state.selectedId === '1' && loading && <SuspenseFallback />}
          {state.selectedId === '1' && error && (
            <Center>
              <ErrorMessage error={error} title={messages.settingsError} />
            </Center>
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
        <Suspense key="step-2" fallback={<SuspenseFallback />}>
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
        <Suspense key="step-3" fallback={<SuspenseFallback />}>
          {state.selectedId === '3' && (
            <ImportOptions
              state={state}
              optionsChecked={optionsChecked}
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
        <Suspense key="step-4" fallback={<SuspenseFallback />}>
          {state.selectedId === '4' && settings && (
            <StartProcessing
              checkedTreeOptions={checkedTreeOptions}
              optionsChecked={optionsChecked}
              state={state}
              settings={settings}
              setSuccessImport={setSuccessImport}
            />
          )}
        </Suspense>
      </TabPanel>
    </Card>
  )
}
