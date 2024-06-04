import type { TabState } from '@vtex/admin-ui'
import {
  Button,
  Flex,
  IconArrowRight,
  Radio,
  RadioGroup,
  Stack,
  useRadioState,
  useToast,
} from '@vtex/admin-ui'
import { Form, TextInput, useFormState } from '@vtex/admin-ui-form'
import React, { useCallback, useState } from 'react'
import { useMutation } from 'react-apollo'
import { useIntl } from 'react-intl'
import type {
  AppSettingsInput,
  Mutation,
  MutationUpdateAppSettingsArgs,
} from 'ssesandbox04.catalog-importer'

import UPDATE_APP_SETTINGS_MUTATION from '../../graphql/updateAppSettings.graphql'
import messages from '../../messages'

type Props = {
  state: TabState
  settings?: AppSettingsInput
  setSettings: (settings: AppSettingsInput) => void
}

const SETTINGS_OPTIONS = {
  DEFAULT: 1,
  CUSTOM: 2,
}

const Settings = (props: Props) => {
  const { formatMessage } = useIntl()
  const showToast = useToast()
  const { state, settings, setSettings } = props
  const form = useFormState<AppSettingsInput>({ defaultValues: settings })
  const [isReset, setIsReset] = useState(false)
  const stateDefaultSettings = useRadioState({
    defaultValue:
      settings?.useDefault ?? SETTINGS_OPTIONS.DEFAULT
        ? SETTINGS_OPTIONS.DEFAULT
        : SETTINGS_OPTIONS.CUSTOM,
  })

  const defaultSettingsValue = stateDefaultSettings.value

  const [updateAppSettings, { loading: loadingUpdate }] = useMutation<
    Mutation,
    MutationUpdateAppSettingsArgs
  >(UPDATE_APP_SETTINGS_MUTATION, {
    notifyOnNetworkStatusChange: true,
    onError(error) {
      showToast({
        message: formatMessage({
          id: error.graphQLErrors?.[0]?.message || error.message,
        }),
        variant: 'critical',
        key: 'settings-message',
      })

      setIsReset(false)
    },
    onCompleted(data) {
      setSettings(data.updateAppSettings)

      if (!isReset) {
        state.select('2')
      } else {
        showToast({
          message: 'Settings reseted successfully',
          variant: 'positive',
          key: 'settings-message',
        })

        setIsReset(false)
        stateDefaultSettings.setValue(SETTINGS_OPTIONS.DEFAULT)
        form.reset(data.updateAppSettings)
      }
    },
  })

  const handleSubmit = useCallback(
    (formData: AppSettingsInput) => {
      if (
        defaultSettingsValue === SETTINGS_OPTIONS.CUSTOM &&
        (!formData.account || !formData.vtexAppKey || !formData.vtexAppToken)
      ) {
        showToast({
          message: formatMessage(messages.settingsMissingError),
          variant: 'critical',
          key: 'settings-message',
        })

        return
      }

      const newSettings = {
        ...formData,
        useDefault: defaultSettingsValue === SETTINGS_OPTIONS.DEFAULT,
      }

      updateAppSettings({ variables: { settings: newSettings } })
    },
    [formatMessage, showToast, defaultSettingsValue, updateAppSettings]
  )

  const handleResetSettings = useCallback(() => {
    // TODO: add a modal dialog instead of window.confirm
    // eslint-disable-next-line no-alert
    if (window.confirm(formatMessage(messages.settingsResetConfirmation))) {
      setIsReset(true)
      updateAppSettings({ variables: { settings: {} } })
    }
  }, [formatMessage, updateAppSettings])

  const handleTrim = (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.trim()
  }

  return (
    <Form state={form} onSubmit={handleSubmit}>
      <Stack space="$space-4" fluid>
        <RadioGroup
          state={stateDefaultSettings}
          aria-label="radio-group"
          label=""
        >
          <Stack
            space="$space-4"
            direction={{ mobile: 'column', tablet: 'row' }}
          >
            <Radio
              value={SETTINGS_OPTIONS.DEFAULT}
              label={formatMessage(messages.settingsDefaultLabel)}
            />
            <Radio
              value={SETTINGS_OPTIONS.CUSTOM}
              label={formatMessage(messages.settingsCustomLabel)}
            />
            {/* {process.env.NODE_ENV === 'development' && ( */}
            <Button
              variant="secondary"
              loading={isReset && loadingUpdate}
              disabled={isReset && loadingUpdate}
              onClick={handleResetSettings}
            >
              {formatMessage(messages.settingsResetLabel)}
            </Button>
            {/* )} */}
          </Stack>
        </RadioGroup>
        {stateDefaultSettings.value === SETTINGS_OPTIONS.CUSTOM && (
          <>
            <TextInput
              label={formatMessage(messages.settingsComponentsLabel)}
              helpText={formatMessage(messages.settingsComponentsHelpText)}
              name="account"
              state={form}
              onInput={handleTrim}
            />
            <TextInput
              label={formatMessage(messages.settingsComponentsLabel2)}
              helpText={formatMessage(messages.settingsComponentsHelpText2)}
              name="vtexAppKey"
              state={form}
              onInput={handleTrim}
            />
            <TextInput
              label={formatMessage(messages.settingsComponentsLabel3)}
              helpText={formatMessage(messages.settingsComponentsHelpText3)}
              name="vtexAppToken"
              state={form}
              onInput={handleTrim}
            />
          </>
        )}
        <Flex justify="end">
          <Button
            type="submit"
            loading={loadingUpdate}
            disabled={loadingUpdate}
            icon={<IconArrowRight />}
            iconPosition="end"
          >
            {formatMessage(messages.nextLabel)}
          </Button>
        </Flex>
      </Stack>
    </Form>
  )
}

export default Settings
