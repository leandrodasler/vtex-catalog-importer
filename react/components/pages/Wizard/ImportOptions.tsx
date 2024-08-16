import type { RadioState, TabState, useSwitchState } from '@vtex/admin-ui'
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
  Radio,
  RadioGroup,
  Spinner,
  Stack,
  Switch,
  TextInput,
  Tooltip,
} from '@vtex/admin-ui'
import React from 'react'
import { useIntl } from 'react-intl'
import type { Query, Warehouse } from 'ssesandbox04.catalog-importer'
import { useRuntime } from 'vtex.render-runtime'

import { STOCK_OPTIONS } from '.'
import {
  ErrorMessage,
  FlexCenterResponsive,
  goToWarehousePage,
  InputInlineWrapper,
  messages,
  notLastColumnTheme,
  threeColumnsUnits,
} from '../../common'
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
        <Column units={threeColumnsUnits} className={notLastColumnTheme}>
          <FlexCenterResponsive>
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
              <InputInlineWrapper>
                <Switch
                  state={importImagesState}
                  label={formatMessage(messages.importImage)}
                />
              </InputInlineWrapper>
              <InputInlineWrapper>
                <Switch
                  state={importPricesState}
                  label={formatMessage(messages.importPrice)}
                />
              </InputInlineWrapper>
            </CheckboxGroup>
          </FlexCenterResponsive>
        </Column>
        <Column units={threeColumnsUnits} className={notLastColumnTheme}>
          <FlexCenterResponsive>
            <RadioGroup
              state={stocksOptionState}
              label={formatMessage(messages.importStocks)}
            >
              <InputInlineWrapper>
                <Radio
                  value={STOCK_OPTIONS.KEEP_SOURCE}
                  label={formatMessage(messages.optionsKEEP_SOURCE)}
                />
              </InputInlineWrapper>
              <InputInlineWrapper>
                <Radio
                  value={STOCK_OPTIONS.UNLIMITED}
                  label={formatMessage(messages.optionsUNLIMITED)}
                />
              </InputInlineWrapper>
              <InputInlineWrapper>
                <Radio
                  value={STOCK_OPTIONS.TO_BE_DEFINED}
                  label={formatMessage(messages.optionsTO_BE_DEFINED)}
                />
              </InputInlineWrapper>
              {stocksOptionState.value === STOCK_OPTIONS.TO_BE_DEFINED && (
                <Flex className={csx({ width: 100 })}>
                  <TextInput
                    type="number"
                    value={stockValue}
                    min={0}
                    onChange={(v) => setStockValue(+v.target.value)}
                  />
                </Flex>
              )}
            </RadioGroup>
          </FlexCenterResponsive>
        </Column>
        <Column units={threeColumnsUnits}>
          <FlexCenterResponsive>
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
                      {formatMessage(messages.targetWarehouse)}
                      <Tooltip
                        text={formatMessage(messages.warehousesTooltip)}
                      />
                    </Stack>
                  }
                >
                  {targetWarehouses.map(({ id, name }: Warehouse) => (
                    <InputInlineWrapper key={`warehouse-${id}`}>
                      <Radio value={id} label={`#${id} - ${name}`} />
                    </InputInlineWrapper>
                  ))}
                </RadioGroup>
              </Center>
            )}
          </FlexCenterResponsive>
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
