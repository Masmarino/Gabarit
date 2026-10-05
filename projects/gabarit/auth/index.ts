// Also exported, for Gabarit's own entry points only (not public API): `authLabels`, `focusAfterRender`, `focusNow`.
export { AuthFooter, AuthFooterLink } from './auth-footer/auth-footer'
export {
  AUTH_LABELS,
  DEFAULT_ACTIVATE_LABELS,
  DEFAULT_BACKUP_CODES_LABELS,
  DEFAULT_LOGIN_LABELS,
  DEFAULT_MFA_ENROLLMENT_LABELS,
  DEFAULT_MFA_SETTINGS_LABELS,
  DEFAULT_PASSKEY_SETTINGS_LABELS,
  DEFAULT_REGISTER_LABELS,
  DEFAULT_RESET_PASSWORD_LABELS,
  DEFAULT_TOTP_QR_LABELS,
  authLabels,
  provideAuthLabels,
  type ActivateLabels,
  type AuthLabels,
  type BackupCodesLabels,
  type EnrolledFactor,
  type LoginLabels,
  type MfaEnrollmentLabels,
  type MfaSettingsLabels,
  type PasskeySettingsLabels,
  type RegisterLabels,
  type ResetPasswordLabels,
  type TotpQrLabels,
} from './auth-labels'
export { AuthPanel } from './auth-panel/auth-panel'
export {
  AUTH_PORT,
  type AuthConfig,
  type AuthPort,
  type LoginResponse,
  type MfaProof,
  type MfaSetupResult,
  type PasskeyChallenge,
  type TotpEnrollment,
} from './ports/auth.port'
export {
  MFA_PORT,
  type BackupCodesResult,
  type MfaPort,
  type MfaStatus,
  type Passkey,
} from './ports/mfa.port'
export {
  classifyActivateFailure,
  classifyRegisterFailure,
  type ActivateFailure,
  type RegisterFailure,
} from './shared/account-errors'
export {
  MIN_PASSWORD_LENGTH,
  USERNAME_PATTERN,
  accountName,
  emailProblem,
  passwordProblem,
  usernameProblem,
  type EmailProblem,
  type PasswordProblem,
  type UsernameProblem,
} from './shared/account-rules'
export { ACTIVATION_TOKEN_SHAPE, activationToken } from './shared/activation-link'
export { focusAfterRender, focusNow } from './shared/focus-after-render'
export {
  classifyMfaFailure,
  classifyPasswordFailure,
  isTooManyPasskeys,
  type MfaFailure,
  type PasswordGatedFailure,
} from './shared/mfa-errors'
export { MfaSettingsState, type MfaFormOwner } from './shared/mfa-settings-state'
export {
  PASSKEY_NAME_MAX,
  passkeyNameProblem,
  type PasskeyNameProblem,
} from './shared/passkey-name'
export {
  AUTH_PORT_ERROR_BODIES,
  isAuthPortError,
  portErrorMessage,
  type AuthPortError,
} from './shared/port-error'
export {
  base64UrlToBuffer,
  bufferToBase64Url,
  classifyPasskeyError,
  createPasskeyCredential,
  getPasskeyAssertion,
  passkeysSupported,
  type PasskeyFailure,
} from './webauthn'
