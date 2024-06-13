import type { TabState } from '@vtex/admin-ui'
import {
  Button,
  Flex,
  IconArrowRight,
  Modal,
  ModalContent,
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
import { handleTrim, messages } from '../../common'
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
  const defaultSettingsState = useRadioState({
    defaultValue:
      settings?.useDefault ?? SETTINGS_OPTIONS.DEFAULT
        ? SETTINGS_OPTIONS.DEFAULT
        : SETTINGS_OPTIONS.CUSTOM,
  })

  const defaultSettingsValue = defaultSettingsState.value

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
      form.reset(data.updateAppSettings)

      if (!resetModal.open) {
        state.select(state.next())
      } else {
        showToast({
          message: formatMessage(messages.settingsResetSuccess),
          variant: 'positive',
          key: 'settings-message',
        })

        resetModal.hide()
        defaultSettingsState.setValue(SETTINGS_OPTIONS.DEFAULT)
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

  return (
    <Form state={form} onSubmit={handleSubmit}>
      <Modal state={resetModal}>
        <ModalHeader>
          <ModalTitle>
            {formatMessage(messages.settingsResetConfirmation)}
          </ModalTitle>
          <ModalDismiss />
        </ModalHeader>
        <ModalContent>{formatMessage(messages.settingsResetText)}</ModalContent>
        <ModalFooter>
          <Button
            disabled={loadingUpdate}
            variant="secondary"
            onClick={() => resetModal.hide()}
          >
            {formatMessage(messages.cancelLabel)}
          </Button>
          <Button
            onClick={handleResetSettings}
            disabled={loadingUpdate}
            loading={resetModal.open && loadingUpdate}
          >
            {formatMessage(messages.settingsResetLabel)}
          </Button>
        </ModalFooter>
      </Modal>
      <Stack space="$space-4" fluid>
        <RadioGroup
          state={defaultSettingsState}
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
              disabled={loadingUpdate}
              onClick={() => resetModal.show()}
            >
              {formatMessage(messages.settingsResetLabel)}
            </Button>
          </Stack>
        </RadioGroup>
        {defaultSettingsState.value === SETTINGS_OPTIONS.CUSTOM && (
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
