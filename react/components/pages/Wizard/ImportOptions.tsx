import type { RadioState, TabState, useSwitchState } from '@vtex/admin-ui'
import {
  Button,
  Center,
  CheckboxGroup,
  Column,
  Columns,
  csx,
  Flex,
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  Label,
  NumberInput,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  Tooltip,
  useBreakpoint,
} from '@vtex/admin-ui'
import React from 'react'
import { useIntl } from 'react-intl'
import type {
  AppSettingsInput,
  Query,
  QueryWarehousesArgs,
} from 'ssesandbox04.catalog-importer'
import { useRuntime } from 'vtex.render-runtime'

import { STOCK_OPTIONS } from '.'
import { messages, SuspenseFallback } from '../../common'
import { useQueryCustom, WAREHOUSES_QUERY } from '../../graphql'
import { WarehouseList } from './common'

interface Props {
  state: TabState
  settings?: AppSettingsInput
  importImagesState: ReturnType<typeof useSwitchState>
  importPricesState: ReturnType<typeof useSwitchState>
  stocksOptionState: RadioState
  stockValue: number
  setStockValue: React.Dispatch<React.SetStateAction<number>>
  sourceWarehousesState: RadioState
  targetWarehousesState: RadioState
}

export default function ImportOptions({
  state,
  settings,
  importImagesState,
  importPricesState,
  stocksOptionState,
  stockValue,
  setStockValue,
  sourceWarehousesState,
  targetWarehousesState,
}: Props) {
  const { account } = useRuntime()
  const { formatMessage } = useIntl()
  const { breakpoint } = useBreakpoint()
  const { data, loading } = useQueryCustom<Query, QueryWarehousesArgs>(
    WAREHOUSES_QUERY,
    {
      variables: { settings },
      onCompleted({ warehouses }) {
        if (!sourceWarehousesState.value) {
          sourceWarehousesState.setValue(warehouses.source[0].id)
        }

        if (!targetWarehousesState.value) {
          targetWarehousesState.setValue(warehouses.target[0].id)
        }
      },
    }
  )

  const sourceWarehouses = data?.warehouses.source
  const targetWarehouses = data?.warehouses.target
  const sourceAccount = settings?.useDefault
    ? formatMessage(messages.settingsDefaultShort)
    : settings?.account

  return (
    <Stack space="$space-4" fluid>
      <Columns space={{ mobile: '$space-0', tablet: '$space-12' }}>
        <Column
          units={{ mobile: 12, tablet: 6 }}
          className={csx({ marginBottom: '$space-4' })}
        >
          <Flex justify={{ mobile: 'left', tablet: 'right' }}>
            <CheckboxGroup
              label="Images and prices"
              id="options-checkbox-group"
            >
              <Switch
                state={importImagesState}
                label={formatMessage(messages.importImage)}
              />
              <Switch
                state={importPricesState}
                label={formatMessage(messages.importPrice)}
              />
            </CheckboxGroup>
          </Flex>
        </Column>
        <Column units={{ mobile: 12, tablet: 6 }}>
          <RadioGroup
            state={stocksOptionState}
            label={formatMessage(messages.importStocks)}
          >
            <Radio
              value={STOCK_OPTIONS.KEEP_SOURCE}
              label={formatMessage(messages.optionsKEEP_SOURCE)}
            />
            <Radio
              value={STOCK_OPTIONS.UNLIMITED}
              label={formatMessage(messages.optionsUNLIMITED)}
            />
            <Radio
              value={STOCK_OPTIONS.TO_BE_DEFINED}
              label={formatMessage(messages.optionsTO_BE_DEFINED)}
            />
            {stocksOptionState.value === STOCK_OPTIONS.TO_BE_DEFINED && (
              <NumberInput
                label={formatMessage(messages.stockValue)}
                value={stockValue}
                min={0}
                onChange={(v) => setStockValue(+v)}
              />
            )}
          </RadioGroup>
        </Column>
      </Columns>
      {loading ? (
        <SuspenseFallback />
      ) : (
        <>
          <Center>
            <Label className={csx({ color: '$secondary' })}>
              {formatMessage(messages.warehousesLabel)}{' '}
            </Label>
            <Tooltip text={formatMessage(messages.warehousesTooltip)} />
          </Center>
          <Flex
            className={csx({ gap: '$space-4' })}
            direction={{ mobile: 'column', tablet: 'row' }}
          >
            <WarehouseList
              state={sourceWarehousesState}
              data={sourceWarehouses}
              title={formatMessage(messages.warehousesSource, {
                account: sourceAccount,
              })}
            />
            <Center>
              {breakpoint === 'mobile' ? <IconArrowDown /> : <IconArrowRight />}
            </Center>
            <WarehouseList
              state={targetWarehousesState}
              data={targetWarehouses}
              title={formatMessage(messages.warehousesTarget, { account })}
            />
          </Flex>
        </>
      )}
      <Flex justify="space-between">
        <Button
          variant="secondary"
          onClick={() => state.select('2')}
          icon={<IconArrowLeft />}
        >
          {formatMessage(messages.previousLabel)}
        </Button>
        <Button
          disabled={loading}
          onClick={() => state.select('4')}
          icon={<IconArrowRight />}
          iconPosition="end"
        >
          {formatMessage(messages.nextLabel)}
        </Button>
      </Flex>
    </Stack>
  )
}
