import type { TabState } from '@vtex/admin-ui'
import {
  Button,
  Flex,
  IconArrowRight,
  Modal,
  ModalDismiss,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  Radio,
  RadioGroup,
  Stack,
  useModalState,
  useRadioState,
  useToast,
} from '@vtex/admin-ui'
import { Form, TextInput, useFormState } from '@vtex/admin-ui-form'
import React, { useCallback } from 'react'
import { useMutation } from 'react-apollo'
import { useIntl } from 'react-intl'
import type {
  AppSettingsInput,
  Mutation,
  MutationUpdateAppSettingsArgs,
} from 'ssesandbox04.catalog-importer'

import type { CheckedCategories } from '.'
import { messages } from '../../common'
import {
  UPDATE_APP_SETTINGS_MUTATION,
  getGraphQLMessageDescriptor,
} from '../../graphql'

type Props = {
  state: TabState
  settings?: AppSettingsInput
  setSettings: (settings: AppSettingsInput) => void
  setCheckedTreeOptions: React.Dispatch<React.SetStateAction<CheckedCategories>>
}

const SETTINGS_OPTIONS = {
  DEFAULT: 1,
  CUSTOM: 2,
}

const Settings = (props: Props) => {
  const { formatMessage } = useIntl()
  const showToast = useToast()
  const { state, settings, setSettings, setCheckedTreeOptions } = props
  const form = useFormState<AppSettingsInput>({ defaultValues: settings })
  const resetModal = useModalState()
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
        message: formatMessage(getGraphQLMessageDescriptor(error)),
        variant: 'critical',
        key: 'settings-message',
      })
    },
    onCompleted(data) {
      setSettings(data.updateAppSettings)

      if (!resetModal.open) {
        state.select(state.next())
      } else {
        showToast({
          message: formatMessage(messages.settingsResetSuccess),
          variant: 'positive',
          key: 'settings-message',
        })

        resetModal.hide()
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

      setCheckedTreeOptions({})

      updateAppSettings({ variables: { settings: newSettings } })
    },
    [
      defaultSettingsValue,
      formatMessage,
      setCheckedTreeOptions,
      showToast,
      updateAppSettings,
    ]
  )

  const handleResetSettings = useCallback(() => {
    updateAppSettings({ variables: { settings: {} } })
  }, [updateAppSettings])

  const handleTrim = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.trim()
  }, [])

  return (
    <Form state={form} onSubmit={handleSubmit}>
      <Modal state={resetModal}>
        <ModalHeader>
          <ModalTitle>
            {formatMessage(messages.settingsResetConfirmation)}
          </ModalTitle>
          <ModalDismiss />
        </ModalHeader>
        <ModalFooter>
          <Button variant="criticalSecondary" onClick={() => resetModal.hide()}>
            {formatMessage(messages.noLabel)}
          </Button>
          <Button
            variant="critical"
            onClick={handleResetSettings}
            loading={resetModal.open && loadingUpdate}
          >
            {formatMessage(messages.yesLabel)}
          </Button>
        </ModalFooter>
      </Modal>
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
            <Button
              variant="tertiary"
              disabled={!resetModal.open && loadingUpdate}
              onClick={() => resetModal.show()}
            >
              {formatMessage(messages.settingsResetLabel)}
            </Button>
          </Stack>
        </RadioGroup>
        {stateDefaultSettings.value === SETTINGS_OPTIONS.CUSTOM && (
          <>
            <TextInput
              label={formatMessage(messages.settingsAccountLabel)}
              helpText={formatMessage(messages.settingsAccountHelpText)}
              name="account"
              state={form}
              onInput={handleTrim}
            />
            <TextInput
              label={formatMessage(messages.settingsAppKeyLabel)}
              helpText={formatMessage(messages.settingsAppKeyHelpText)}
              name="vtexAppKey"
              state={form}
              onInput={handleTrim}
            />
            <TextInput
              label={formatMessage(messages.settingsAppTokenLabel)}
              helpText={formatMessage(messages.settingsAppTokenHelpText)}
              name="vtexAppToken"
              state={form}
              onInput={handleTrim}
            />
          </>
        )}
        <Flex justify="end">
          <Button
            type="submit"
            loading={!resetModal.open && loadingUpdate}
            disabled={!resetModal.open && loadingUpdate}
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
