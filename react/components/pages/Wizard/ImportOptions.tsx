import type {
  RadioState,
  ResponsiveProp,
  TabState,
  useSwitchState,
} from '@vtex/admin-ui'
import {
  Button,
  Center,
  CheckboxGroup,
  Column,
  Columns,
  csx,
  Flex,
  IconArrowLeft,
  IconArrowRight,
  NumberInput,
  Radio,
  RadioGroup,
  Spinner,
  Stack,
  Switch,
  Tooltip,
} from '@vtex/admin-ui'
import React from 'react'
import { useIntl } from 'react-intl'
import type { Query, Warehouse } from 'ssesandbox04.catalog-importer'
import { useRuntime } from 'vtex.render-runtime'

import { STOCK_OPTIONS } from '.'
import { ErrorMessage, goToWarehousePage, messages } from '../../common'
import { useQueryCustom, WAREHOUSES_QUERY } from '../../graphql'

interface Props {
  state: TabState
  importImagesState: ReturnType<typeof useSwitchState>
  importPricesState: ReturnType<typeof useSwitchState>
  stocksOptionState: RadioState
  stockValue: number
  setStockValue: React.Dispatch<React.SetStateAction<number>>
  targetWarehousesState: RadioState
}

const columnUnits: ResponsiveProp<4 | 12> = { mobile: 12, tablet: 4 }
const notLastColumnTheme = csx({ marginBottom: '$space-4' })

export default function ImportOptions({
  state,
  importImagesState,
  importPricesState,
  stocksOptionState,
  stockValue,
  setStockValue,
  targetWarehousesState,
}: Props) {
  const { account } = useRuntime()
  const { formatMessage } = useIntl()
  const { data, loading, error } = useQueryCustom<{
    targetWarehouses: Query['targetWarehouses']
  }>(WAREHOUSES_QUERY, {
    toastError: false,
    onCompleted({ targetWarehouses }) {
      if (!targetWarehousesState.value) {
        targetWarehousesState.setValue(targetWarehouses[0]?.id)
      }
    },
  })

  const targetWarehouses = data?.targetWarehouses
  const disabledNext = loading || !targetWarehousesState.value

  return (
    <Stack space="$space-4" fluid>
      <Columns space={{ mobile: '$space-0', tablet: '$space-12' }}>
        <Column units={columnUnits} className={notLastColumnTheme}>
          <Flex justify="center">
            <CheckboxGroup
              label={
                <Stack direction="row">
                  {formatMessage(messages.optionsImagesPrices)}
                  <Tooltip
                    text={formatMessage(messages.optionsImagesPricesTooltip)}
                  />
                </Stack>
              }
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
        <Column units={columnUnits} className={notLastColumnTheme}>
          <Flex justify="center">
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
                <Flex className={csx({ width: 175 })}>
                  <NumberInput
                    // label={formatMessage(messages.stockValue)}
                    value={stockValue}
                    min={0}
                    onChange={(v) => setStockValue(+v)}
                  />
                </Flex>
              )}
            </RadioGroup>
          </Flex>
        </Column>
        <Column units={columnUnits}>
          <Flex justify="center">
            {loading && <Spinner />}
            {error && (
              <Center>
                <ErrorMessage title={messages.warehousesError} error={error} />
              </Center>
            )}
            {!loading && !error && !targetWarehouses?.length && (
              <Center>
                <ErrorMessage
                  title={formatMessage(messages.warehousesEmpty, { account })}
                >
                  <Flex justify="end">
                    <Button
                      variant="neutralTertiary"
                      onClick={goToWarehousePage}
                    >
                      {formatMessage(messages.warehousesEmptyAction)}
                    </Button>
                  </Flex>
                </ErrorMessage>
              </Center>
            )}
            {!loading && !error && !!targetWarehouses?.length && (
              <Center>
                <RadioGroup
                  state={targetWarehousesState}
                  label={
                    <Stack direction="row">
                      {formatMessage(messages.warehousesLabel)}
                      <Tooltip
                        text={formatMessage(messages.warehousesTooltip)}
                      />
                    </Stack>
                  }
                >
                  {targetWarehouses.map(({ id, name }: Warehouse) => (
                    <Radio
                      key={`warehouse-${id}`}
                      value={id}
                      label={`#${id} - ${name}`}
                    />
                  ))}
                </RadioGroup>
              </Center>
            )}
          </Flex>
        </Column>
      </Columns>
      <Flex justify="space-between">
        <Button
          variant="secondary"
          onClick={() => state.select('2')}
          icon={<IconArrowLeft />}
        >
          {formatMessage(messages.previousLabel)}
        </Button>
        <Button
          disabled={disabledNext}
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
