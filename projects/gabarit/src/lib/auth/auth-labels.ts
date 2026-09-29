import { InjectionToken, type Provider, computed, inject, type Signal } from '@angular/core'

export type EnrolledFactor = 'totp' | 'passkey'

export interface TotpQrLabels {
  fallback: string
  imageAlt: string
  secretLabel: string
  fallbackSecretLabel: string
  copyLabel: string
  copied: string
  copyFailed: string
}

export const DEFAULT_TOTP_QR_LABELS: Readonly<TotpQrLabels> = Object.freeze<TotpQrLabels>({
  fallback: 'The QR code could not be displayed: enter the key below in your app.',
  imageAlt: 'QR code to scan with your authenticator app',
  secretLabel: 'Or enter this key in your app',
  fallbackSecretLabel: 'Setup key',
  copyLabel: 'Copy the setup key',
  copied: 'Copied',
  copyFailed: 'Copy failed, key selected',
})

export interface BackupCodesLabels {
  listLabel: string
  copy: string
  copied: string
  copyFailed: string
  download: string
  acknowledge: string
  fileName: string
  fileTitle: string
  fileNotice: string
}

export const DEFAULT_BACKUP_CODES_LABELS: Readonly<BackupCodesLabels> =
  Object.freeze<BackupCodesLabels>({
    listLabel: 'Backup codes',
    copy: 'Copy codes',
    copied: 'Codes copied',
    copyFailed: 'Copy failed, codes selected',
    download: 'Download',
    acknowledge: 'I have saved my backup codes',
    fileName: 'backup-codes.txt',
    fileTitle: 'Backup codes',
    fileNotice: 'Each code can only be used once. Keep them somewhere safe.',
  })

interface CommonFailureLabels {
  tooManyAttempts: string
}

export interface MfaEnrollmentLabels extends CommonFailureLabels {
  step: (current: number, total: number) => string
  choiceHeading: string
  scanHeading: string
  passkeyHeading: string
  codesHeading: string
  mandatory: string
  choiceLead: string
  passkeyOption: string
  recommended: string
  passkeyOptionText: string
  usePasskey: string
  appOption: string
  appOptionText: string
  useApp: string
  preparing: string
  back: string
  todoInstall: string
  todoScan: string
  todoKeep: string
  begin: string
  scanLead: string
  codeLabel: string
  activate: string
  verifying: string
  passkeyLead: string
  passkeyNameLabel: string
  defaultPasskeyName: string
  createPasskey: string
  creating: string
  promptOpen: string
  codesLead: (factor: EnrolledFactor) => string
  continue: string
  enterCode: string
  wrongCode: string
  startFailed: string
  activationFailed: string
  passkeyFailed: string
  alreadyRegistered: string
  cancelled: string
  browserUnsupported: string
  passkeysUnavailable: string
  loginExpired: string
  alreadySetUp: string
  nameTooLong: (max: number) => string
  nameControlCharacters: string
}

export const DEFAULT_MFA_ENROLLMENT_LABELS: Readonly<MfaEnrollmentLabels> =
  Object.freeze<MfaEnrollmentLabels>({
    step: (current, total) => `Step ${current} of ${total}`,
    choiceHeading: 'Protect your account',
    scanHeading: 'Set up your app',
    passkeyHeading: 'Create your passkey',
    codesHeading: 'Save your backup codes',
    mandatory: 'Two-factor authentication is required to secure your account.',
    choiceLead: 'Choose how you will confirm your identity each time you sign in.',
    passkeyOption: 'Passkey',
    recommended: 'Recommended',
    passkeyOptionText:
      'Touch ID, Windows Hello, a PIN or a security key: nothing to type, and impossible to phish.',
    usePasskey: 'Use a passkey',
    appOption: 'Authenticator app',
    appOptionText:
      'Google Authenticator, Authy, 1Password…: a 6-digit code to type each time you sign in.',
    useApp: 'Use an app',
    preparing: 'Preparing',
    back: 'Back',
    todoInstall: 'Install an authenticator app (Google Authenticator, Authy, 1Password…).',
    todoScan: 'Scan the QR code shown at the next step and enter the 6-digit code.',
    todoKeep: 'Keep your backup codes: they will get you in if you lose your phone.',
    begin: 'Get started',
    scanLead:
      'Scan this QR code with your authenticator app, then enter the 6-digit code it shows.',
    codeLabel: '6-digit code',
    activate: 'Activate',
    verifying: 'Verifying',
    passkeyLead:
      'Give this key a name to recognise it later, then confirm with your device: Touch ID, Windows Hello, PIN or security key.',
    passkeyNameLabel: 'Key name (optional)',
    defaultPasskeyName: 'Passkey',
    createPasskey: 'Create the passkey',
    creating: 'Creating',
    promptOpen: 'Confirm on your device to create the key.',
    codesLead: (factor) =>
      `Two-factor authentication is on. These codes will not be shown again: they let you sign in if you lose access to ${factor === 'passkey' ? 'your passkey' : 'your app'}, and each one works only once.`,
    continue: 'Continue',
    enterCode: 'Enter the 6-digit code from your app',
    wrongCode: 'Incorrect code',
    startFailed: 'The setup could not start, try again.',
    activationFailed: 'Activation failed, try again.',
    passkeyFailed: 'The passkey could not be created, try again.',
    alreadyRegistered: 'This key is already registered',
    cancelled: 'Operation cancelled',
    browserUnsupported: 'This browser does not support passkeys.',
    passkeysUnavailable: 'Passkeys are not available on this server.',
    loginExpired: 'Your sign-in has expired, sign in again.',
    alreadySetUp: 'Two-factor authentication is already set up, sign in again.',
    tooManyAttempts: 'Too many attempts, try again in a few minutes',
    nameTooLong: (max) => `The name must not be longer than ${max} characters`,
    nameControlCharacters: 'The name cannot contain control characters',
  })

export interface LoginLabels extends CommonFailureLabels {
  heading: string
  intro: string
  challengeHeading: string
  enrollmentHeading: string
  username: string
  password: string
  showPassword: string
  hidePassword: string
  submit: string
  submitting: string
  registerPrompt: string
  wrongCredentials: string
  loginFailed: string
  introBackupCode: string
  introPasskeyOrCode: string
  introPasskey: string
  introCode: string
  blockedByServer: string
  blockedByBrowser: string
  backToPasskeyOrApp: string
  backToPasskey: string
  backToApp: string
  useBackupCode: string
  back: string
  backupCodeLabel: string
  codeLabel: string
  verify: string
  verifying: string
  usePasskey: string
  passkeyValidating: string
  or: string
  passkeyPrompt: string
  enterBackupCode: string
  enterCode: string
  wrongCode: string
  verifyFailed: string
  cancelled: string
  browserUnsupported: string
  passkeyRefused: string
  passkeysUnavailable: string
  loginExpired: string
}

export const DEFAULT_LOGIN_LABELS: Readonly<LoginLabels> = Object.freeze<LoginLabels>({
  heading: 'Sign in',
  intro: 'Sign in to pick up where you left off.',
  challengeHeading: 'Two-step verification',
  enrollmentHeading: 'Two-factor authentication',
  username: 'Username',
  password: 'Password',
  showPassword: 'Show password',
  hidePassword: 'Hide password',
  submit: 'Sign in',
  submitting: 'Signing in',
  registerPrompt: 'No account yet?',
  wrongCredentials: 'Incorrect username or password',
  loginFailed: 'Sign-in failed, try again.',
  introBackupCode: 'Enter one of your backup codes. Each code works only once.',
  introPasskeyOrCode: 'Use your passkey, or enter the 6-digit code from your app.',
  introPasskey:
    'Confirm it is really you with your passkey: fingerprint, face, device PIN or security key.',
  introCode: 'Enter the 6-digit code shown by your authenticator app.',
  blockedByServer: 'Passkeys are not available on this server. Use a backup code.',
  blockedByBrowser: 'This browser does not support passkeys. Use a backup code.',
  backToPasskeyOrApp: 'Use my passkey or my app',
  backToPasskey: 'Use my passkey',
  backToApp: 'Use the code from my app',
  useBackupCode: 'Use a backup code',
  back: 'Back',
  backupCodeLabel: 'Backup code',
  codeLabel: '6-digit code',
  verify: 'Verify',
  verifying: 'Verifying',
  usePasskey: 'Use a passkey',
  passkeyValidating: 'Waiting for your device',
  or: 'or',
  passkeyPrompt: 'Confirm on your device to sign in.',
  enterBackupCode: 'Enter a backup code',
  enterCode: 'Enter the 6-digit code from your app',
  wrongCode: 'Incorrect code',
  verifyFailed: 'Verification failed, try again.',
  cancelled: 'Operation cancelled',
  browserUnsupported: 'This browser does not support passkeys.',
  passkeyRefused: 'Passkey refused',
  passkeysUnavailable: 'Passkeys are not available on this server.',
  loginExpired: 'Your sign-in has expired, sign in again.',
  tooManyAttempts: 'Too many attempts, try again in a few minutes',
})

export interface RegisterLabels extends CommonFailureLabels {
  heading: string
  intro: string
  enrollmentHeading: string
  loading: string
  closedHeading: string
  closedMessage: string
  signIn: string
  createdHeading: string
  createdMessage: string
  enrollmentExpired: string
  createdName: string
  username: string
  usernameHint: string
  email: string
  password: string
  passwordHint: (minLength: number) => string
  showPassword: string
  hidePassword: string
  submit: string
  submitting: string
  signInPrompt: string
  usernameEmpty: string
  usernameInvalid: string
  emailEmpty: string
  emailInvalid: string
  passwordEmpty: string
  passwordTooShort: (minLength: number) => string
  invalid: string
  reserved: string
  taken: string
  failed: string
}

export const DEFAULT_REGISTER_LABELS: Readonly<RegisterLabels> = Object.freeze<RegisterLabels>({
  heading: 'Create an account',
  intro: 'Create your account to get started.',
  enrollmentHeading: 'Two-factor authentication',
  loading: 'Loading',
  closedHeading: 'Registration is closed',
  closedMessage:
    'This instance does not accept open registration. Ask an administrator for an invitation: you will receive a link by email to activate your account.',
  signIn: 'Sign in',
  createdHeading: 'Your account has been created',
  createdMessage:
    'Sign in with your password to finish setting up two-factor authentication, required before you start.',
  enrollmentExpired: 'The setup has expired. ',
  createdName: 'Your username:',
  username: 'Username',
  usernameHint: '3 to 32 characters: letters, digits, - and _. Saved in lower case.',
  email: 'Email address',
  password: 'Password',
  passwordHint: (minLength) => `At least ${minLength} characters.`,
  showPassword: 'Show password',
  hidePassword: 'Hide password',
  submit: 'Create my account',
  submitting: 'Creating the account',
  signInPrompt: 'Already have an account?',
  usernameEmpty: 'Enter a username',
  usernameInvalid: 'Start with a letter; 3 to 32 characters: letters, digits, - and _',
  emailEmpty: 'Enter your email address',
  emailInvalid: 'Enter a valid email address, for example name@example.com',
  passwordEmpty: 'Enter a password',
  passwordTooShort: (minLength) => `At least ${minLength} characters`,
  invalid: 'Check the fields',
  reserved: 'This username is not available',
  taken: 'This username or email address is already in use',
  failed: 'The account could not be created, try again.',
  tooManyAttempts: 'Too many attempts, try again in a few minutes',
})

export interface ActivateLabels extends CommonFailureLabels {
  heading: string
  intro: string
  password: string
  passwordHint: (minLength: number) => string
  confirmation: string
  showPassword: string
  hidePassword: string
  submit: string
  submitting: string
  signInPrompt: string
  successHeading: string
  successMessage: string
  invalidHeading: string
  invalidMessage: string
  signIn: string
  passwordEmpty: string
  passwordTooShort: (minLength: number) => string
  confirmationEmpty: string
  mismatch: string
  weakPassword: (minLength: number) => string
  failed: string
}

export const DEFAULT_ACTIVATE_LABELS: Readonly<ActivateLabels> = Object.freeze<ActivateLabels>({
  heading: 'Activate your account',
  intro:
    'Choose the password of your account. Two-factor authentication will be set up the first time you sign in.',
  password: 'New password',
  passwordHint: (minLength) => `At least ${minLength} characters.`,
  confirmation: 'Confirm the password',
  showPassword: 'Show password',
  hidePassword: 'Hide password',
  submit: 'Activate my account',
  submitting: 'Activating',
  signInPrompt: 'Is your account already active?',
  successHeading: 'Your account is activated',
  successMessage:
    'You can now sign in. We will then guide you through protecting your account with two-factor authentication.',
  invalidHeading: 'This link does not work',
  invalidMessage:
    'This invitation link is invalid or has expired. Ask an administrator to send you a new one.',
  signIn: 'Sign in',
  passwordEmpty: 'Enter a password',
  passwordTooShort: (minLength) => `At least ${minLength} characters`,
  confirmationEmpty: 'Confirm your password',
  mismatch: 'The passwords do not match',
  weakPassword: (minLength) => `The password must be at least ${minLength} characters long`,
  failed: 'Activation failed, try again.',
  tooManyAttempts: 'Too many attempts, try again in a few minutes',
})

export interface ResetPasswordLabels extends CommonFailureLabels {
  heading: string
  intro: string
  password: string
  passwordHint: (minLength: number) => string
  confirmation: string
  showPassword: string
  hidePassword: string
  submit: string
  submitting: string
  signInPrompt: string
  successHeading: string
  successMessage: string
  invalidHeading: string
  invalidMessage: string
  signIn: string
  passwordEmpty: string
  passwordTooShort: (minLength: number) => string
  confirmationEmpty: string
  mismatch: string
  weakPassword: (minLength: number) => string
  failed: string
}

export const DEFAULT_RESET_PASSWORD_LABELS: Readonly<ResetPasswordLabels> =
  Object.freeze<ResetPasswordLabels>({
    heading: 'Choose a new password',
    intro:
      'An administrator has reset the password of your account. Choose a new one to sign in again.',
    password: 'New password',
    passwordHint: (minLength) => `At least ${minLength} characters.`,
    confirmation: 'Confirm the new password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    submit: 'Set new password',
    submitting: 'Setting the password',
    signInPrompt: 'Already set your new password?',
    successHeading: 'Your password has been changed',
    successMessage: 'You can now sign in with your new password.',
    invalidHeading: 'This link does not work',
    invalidMessage:
      'This password reset link is invalid or has expired. Ask an administrator to send you a new one.',
    signIn: 'Sign in',
    passwordEmpty: 'Enter a new password',
    passwordTooShort: (minLength) => `At least ${minLength} characters`,
    confirmationEmpty: 'Confirm your new password',
    mismatch: 'The passwords do not match',
    weakPassword: (minLength) => `The password must be at least ${minLength} characters long`,
    failed: 'The new password could not be set, try again.',
    tooManyAttempts: 'Too many attempts, try again in a few minutes',
  })

export interface MfaSettingsLabels extends CommonFailureLabels {
  heading: string
  enrollingHeading: string
  codesHeading: string
  help: string
  codesHelp: string
  loading: string
  loadFailed: string
  retry: string
  enrollLead: string
  enrollSubmit: string
  enrollBusy: string
  enrollFailed: string
  regenerateLead: string
  regenerateSubmit: string
  regenerateBusy: string
  regenerateFailed: string
  disableSubmit: string
  disableCheckBusy: string
  disableFailed: string
  removeTitle: string
  removeHelp: string
  removeAction: string
  removeDialogHeading: string
  removeDialogMessage: string
  removePromptLead: string
  removeBusy: string
  resetTitle: string
  resetHelp: string
  resetAction: string
  resetDialogHeading: string
  resetDialogMessage: string
  resetPromptLead: string
  resetBusy: string
  codesLeft: (count: number) => string
  lowCodes: string
  scanLead: string
  codeLabel: string
  activate: string
  verifying: string
  cancel: string
  close: string
  codesLeadEnrolled: string
  codesLeadRegenerated: string
  dontLeave: string
  done: string
  appConfigured: string
  enabled: string
  appHelpWithPasskey: string
  appHelp: string
  noApp: string
  optional: string
  noAppHelp: string
  addApp: string
  backupCodesTitle: string
  backupCodesHelp: string
  regenerateCodes: string
  noFactorWarning: string
  setUpNow: string
  currentPassword: string
  showPassword: string
  hidePassword: string
  enterPassword: string
  wrongPassword: string
  enterCode: string
  wrongCode: string
  activationFailed: string
  signedOut: string
}

export const DEFAULT_MFA_SETTINGS_LABELS: Readonly<MfaSettingsLabels> =
  Object.freeze<MfaSettingsLabels>({
    heading: 'Authenticator app',
    enrollingHeading: 'Set up the authenticator app',
    codesHeading: 'Backup codes',
    help: 'Google Authenticator, Authy, 1Password…: any TOTP app works.',
    codesHelp: 'Keep them: they are shown only once.',
    loading: 'Loading two-factor authentication…',
    loadFailed: 'Two-factor authentication could not be loaded.',
    retry: 'Retry',
    enrollLead: 'Confirm your password to start the setup.',
    enrollSubmit: 'Continue',
    enrollBusy: 'Preparing',
    enrollFailed: 'The setup could not start, try again.',
    regenerateLead:
      'Confirm your password to generate 10 new codes. The old ones stop working right away.',
    regenerateSubmit: 'Regenerate',
    regenerateBusy: 'Regenerating',
    regenerateFailed: 'The backup codes could not be regenerated, try again.',
    disableSubmit: 'Continue',
    disableCheckBusy: 'Checking',
    disableFailed: 'Two-factor authentication could not be reset, try again.',
    removeTitle: 'Remove the authenticator app',
    removeHelp:
      'Removes your current app. You will be signed out of all your devices and will sign in again with your passkey.',
    removeAction: 'Remove',
    removeDialogHeading: 'Remove the authenticator app?',
    removeDialogMessage:
      'You will be signed out of all your devices. You will sign in again with your passkey, without an app.',
    removePromptLead: 'Confirm your password to remove your authenticator app.',
    removeBusy: 'Removing',
    resetTitle: 'Reset two-factor authentication',
    resetHelp:
      'Removes your current app. You will be signed out of all your devices and will have to set up a new one the next time you sign in.',
    resetAction: 'Reset',
    resetDialogHeading: 'Reset two-factor authentication?',
    resetDialogMessage:
      'You will be signed out and will have to set up a new authenticator app the next time you sign in.',
    resetPromptLead: 'Confirm your password to reset two-factor authentication.',
    resetBusy: 'Resetting',
    codesLeft: (count) =>
      count === 0
        ? 'No backup codes left'
        : count === 1
          ? '1 backup code left'
          : `${count} backup codes left`,
    lowCodes: 'Regenerate some so that you do not lose access to your account.',
    scanLead:
      'Scan this QR code with your authenticator app, then enter the 6-digit code it shows.',
    codeLabel: '6-digit code',
    activate: 'Activate',
    verifying: 'Verifying',
    cancel: 'Cancel',
    close: 'Close',
    codesLeadEnrolled:
      'Two-factor authentication is on. These codes will not be shown again: they let you sign in if you lose access to your app, and each one works only once.',
    codesLeadRegenerated:
      'Here are your new backup codes. The old codes no longer work. These codes will not be shown again, and each one works only once.',
    dontLeave: 'Do not leave this page before you have saved them.',
    done: 'Done',
    appConfigured: 'App configured',
    enabled: 'On',
    appHelpWithPasskey:
      'A 6-digit code, generated by your app, can replace your passkey after your password.',
    appHelp: 'A 6-digit code, generated by your app, is asked after your password.',
    noApp: 'No app configured',
    optional: 'Optional',
    noAppHelp:
      'Your passkey is enough to sign in. Add an app for a second way in: it generates a 6-digit code.',
    addApp: 'Add an app',
    backupCodesTitle: 'Backup codes',
    backupCodesHelp:
      'Each code works only once. Generating new ones invalidates the previous ones.',
    regenerateCodes: 'Regenerate backup codes',
    noFactorWarning:
      'Two-factor authentication is required: you will have to set it up the next time you sign in.',
    setUpNow: 'Set up now',
    currentPassword: 'Current password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    enterPassword: 'Enter your password',
    wrongPassword: 'Incorrect password',
    enterCode: 'Enter the 6-digit code from your app',
    wrongCode: 'Incorrect code',
    activationFailed: 'Activation failed, try again.',
    tooManyAttempts: 'Too many attempts, try again in a few minutes',
    signedOut: 'You have been signed out. Sign in again to continue.',
  })

export interface PasskeySettingsLabels extends CommonFailureLabels {
  heading: string
  description: string
  loading: string
  loadFailed: string
  retry: string
  browserBlocked: string
  serverBlocked: string
  emptyHeading: string
  emptyMessage: string
  listLabel: string
  added: (absolute: boolean) => string
  lastUsed: (absolute: boolean) => string
  neverUsed: string
  delete: string
  deleteKey: (name: string) => string
  passkeyAdded: (name: string) => string
  passkeyGone: (name: string) => string
  addPasskey: string
  finishAppFirst: string
  deleteDialogHeading: string
  deleteDialogMessage: (name: string, lastFactor: boolean) => string
  deleteConfirm: string
  cancel: string
  close: string
  deleting: string
  addLead: string
  promptOpen: string
  nameLabel: string
  defaultPasskeyName: string
  currentPassword: string
  showPassword: string
  hidePassword: string
  create: string
  creating: string
  deleteLead: (name: string) => string
  lastFactorWarning: string
  continue: string
  checking: string
  nameTooLong: (max: number) => string
  nameControlCharacters: string
  enterPassword: string
  wrongPassword: string
  tooManyPasskeys: string
  alreadyRegistered: string
  passkeysUnavailable: string
  addFailed: string
  cancelled: string
  browserUnsupported: string
  deleteFailed: string
  signedOut: string
}

const LAST_FACTOR =
  'This is your last factor: you will have to set up a new one the next time you sign in.'

export const DEFAULT_PASSKEY_SETTINGS_LABELS: Readonly<PasskeySettingsLabels> =
  Object.freeze<PasskeySettingsLabels>({
    heading: 'Passkeys',
    description:
      'Confirm your sign-in with your fingerprint, your face or the PIN of your device, or with a security key.',
    loading: 'Loading passkeys…',
    loadFailed: 'Passkeys could not be loaded.',
    retry: 'Retry',
    browserBlocked:
      'This browser does not support passkeys: you cannot add one here, but you can delete the ones you already have.',
    serverBlocked:
      'Passkeys are not available on this server. You cannot add one, but you can delete the ones you already have.',
    emptyHeading: 'No passkeys',
    emptyMessage: 'Add one to confirm your sign-in with a gesture, without a code to copy.',
    listLabel: 'Registered passkeys',
    added: (absolute) => (absolute ? 'Added on' : 'Added'),
    lastUsed: (absolute) => (absolute ? 'Last used on' : 'Last used'),
    neverUsed: 'Never used',
    delete: 'Delete',
    deleteKey: (name) => `Delete the key ${name}`,
    passkeyAdded: (name) => `Passkey “${name}” added.`,
    passkeyGone: (name) => `The passkey “${name}” no longer exists.`,
    addPasskey: 'Add a passkey',
    finishAppFirst: 'Finish setting up the authenticator app first.',
    deleteDialogHeading: 'Delete this passkey?',
    deleteDialogMessage: (name, lastFactor) =>
      `“${name}” will no longer let you sign in. You will be signed out of all your devices and will have to sign in again.` +
      (lastFactor ? ` ${LAST_FACTOR}` : ''),
    deleteConfirm: 'Delete',
    cancel: 'Cancel',
    close: 'Close',
    deleting: 'Deleting',
    addLead: 'Name this key and confirm your password: your device will then ask you to confirm.',
    promptOpen: 'Confirm on your device to create the key.',
    nameLabel: 'Key name (optional)',
    defaultPasskeyName: 'Passkey',
    currentPassword: 'Current password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    create: 'Create the passkey',
    creating: 'Creating',
    deleteLead: (name) => `Confirm your password to delete “${name}”.`,
    lastFactorWarning: LAST_FACTOR,
    continue: 'Continue',
    checking: 'Checking',
    nameTooLong: (max) => `The name must not be longer than ${max} characters`,
    nameControlCharacters: 'The name cannot contain control characters',
    enterPassword: 'Enter your password',
    wrongPassword: 'Incorrect password',
    tooManyPasskeys:
      'You have reached the maximum number of passkeys: delete one before adding another.',
    alreadyRegistered: 'This key is already registered',
    passkeysUnavailable: 'Passkeys are not available on this server.',
    addFailed: 'The passkey could not be created, try again.',
    cancelled: 'Operation cancelled',
    browserUnsupported: 'This browser does not support passkeys.',
    deleteFailed: 'The passkey could not be deleted, try again.',
    tooManyAttempts: 'Too many attempts, try again in a few minutes',
    signedOut: 'You have been signed out. Sign in again to continue.',
  })

export interface AuthLabels {
  totpQr?: Partial<TotpQrLabels>
  backupCodes?: Partial<BackupCodesLabels>
  mfaEnrollment?: Partial<MfaEnrollmentLabels>
  login?: Partial<LoginLabels>
  register?: Partial<RegisterLabels>
  activate?: Partial<ActivateLabels>
  resetPassword?: Partial<ResetPasswordLabels>
  mfaSettings?: Partial<MfaSettingsLabels>
  passkeySettings?: Partial<PasskeySettingsLabels>
}

export const AUTH_LABELS = new InjectionToken<AuthLabels>('AUTH_LABELS')

export function provideAuthLabels(labels: AuthLabels): Provider {
  return { provide: AUTH_LABELS, useValue: labels }
}

export function authLabels<K extends keyof AuthLabels, T extends object>(
  part: K,
  defaults: T,
  own: Signal<Partial<T>>,
): Signal<T> {
  const provided = inject(AUTH_LABELS, { optional: true })?.[part] as Partial<T> | undefined
  return computed(() => ({ ...defaults, ...defined(provided), ...defined(own()) }))
}

function defined<T extends object>(partial: Partial<T> | undefined): Partial<T> {
  if (!partial) {
    return {}
  }
  return Object.fromEntries(
    Object.entries(partial).filter(([, value]) => value !== undefined),
  ) as Partial<T>
}
