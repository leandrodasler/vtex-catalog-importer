import type { TabState } from '@vtex/admin-ui'
import {
  Button,
  Flex,
  IconArrowRight,
  Modal,
  ModalContent,
  ModalDismiss,
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
import { useIntl } from 'react-intl'
import type {
  AppSettingsInput,
  Mutation,
  MutationUpdateAppSettingsArgs,
} from 'ssesandbox04.catalog-importer'

import type { CheckedCategories } from '.'
import {
  handleTrim,
  InputInlineWrapper,
  messages,
  ModalButtons,
} from '../../common'
import { UPDATE_APP_SETTINGS_MUTATION, useMutationCustom } from '../../graphql'

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

const toastKey = 'settings-message'

const Settings = ({
  state,
  settings,
  setSettings,
  setCheckedTreeOptions,
}: Props) => {
  const { formatMessage } = useIntl()
  const showToast = useToast()
  const form = useFormState<AppSettingsInput>({ defaultValues: settings })
  const resetModal = useModalState()
  const defaultSettingsState = useRadioState({
    defaultValue:
      settings?.useDefault ?? SETTINGS_OPTIONS.DEFAULT
        ? SETTINGS_OPTIONS.DEFAULT
        : SETTINGS_OPTIONS.CUSTOM,
  })

  const defaultSettingsValue = defaultSettingsState.value

  const { mutationFactory, loading } = useMutationCustom<
    Mutation,
    MutationUpdateAppSettingsArgs
  >(UPDATE_APP_SETTINGS_MUTATION, {
    notifyOnNetworkStatusChange: true,
    toastKey,
    onCompleted({ updateAppSettings }) {
      setSettings(updateAppSettings)
      form.reset(updateAppSettings)

      if (!resetModal.open) {
        state.select('2')
      } else {
        showToast({
          message: formatMessage(messages.settingsResetSuccess),
          variant: 'positive',
          key: toastKey,
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
          key: toastKey,
        })

        return
      }

      const newSettings = {
        ...formData,
        useDefault: defaultSettingsValue === SETTINGS_OPTIONS.DEFAULT,
      }

      if (
        newSettings.account !== settings?.account ||
        newSettings.useDefault !== settings?.useDefault
      ) {
        setCheckedTreeOptions({})
      }

      mutationFactory({ variables: { settings: newSettings } })()
    },
    [
      defaultSettingsValue,
      formatMessage,
      mutationFactory,
      setCheckedTreeOptions,
      settings?.account,
      settings?.useDefault,
      showToast,
    ]
  )

  const handleResetSettings = useCallback(
    () => mutationFactory({ variables: { settings: {} } })(),
    [mutationFactory]
  )

  return (
    <Form state={form} onSubmit={handleSubmit}>
      <Modal state={resetModal}>
        <ModalHeader>
          <ModalTitle>
            {formatMessage(messages.settingsResetConfirmation)}
          </ModalTitle>
          <ModalDismiss />
        </ModalHeader>
        <ModalContent>
          {formatMessage(messages.settingsResetText)}
          <ModalButtons>
            <Button
              disabled={loading}
              variant="secondary"
              onClick={() => resetModal.hide()}
            >
              {formatMessage(messages.cancelLabel)}
            </Button>
            <Button
              onClick={handleResetSettings}
              disabled={loading}
              loading={resetModal.open && loading}
            >
              {formatMessage(messages.settingsResetLabel)}
            </Button>
          </ModalButtons>
        </ModalContent>
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
            <InputInlineWrapper>
              <Radio
                value={SETTINGS_OPTIONS.DEFAULT}
                label={formatMessage(messages.settingsDefaultLabel)}
              />
            </InputInlineWrapper>
            <InputInlineWrapper>
              <Radio
                value={SETTINGS_OPTIONS.CUSTOM}
                label={formatMessage(messages.settingsCustomLabel)}
              />
            </InputInlineWrapper>
            <Button
              variant="tertiary"
              disabled={loading}
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
            loading={!resetModal.open && loading}
            disabled={loading}
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
