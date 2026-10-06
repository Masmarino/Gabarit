import * as api from '../public-api'

describe('public surface', () => {
  it('exports the base components and the icon registry', () => {
    for (const name of [
      'Accordion',
      'AccordionItem',
      'Alert',
      'AppShell',
      'Avatar',
      'AvatarGroup',
      'Autocomplete',
      'Badge',
      'Button',
      'Card',
      'CardHeader',
      'CardLink',
      'Checkbox',
      'CheckboxGroup',
      'CommandPalette',
      'CommandPaletteTrigger',
      'DatePicker',
      'DateRangePicker',
      'DescriptionList',
      'Divider',
      'Drawer',
      'EmptyState',
      'FileUpload',
      'Icon',
      'IconRegistry',
      'GbtInput',
      'ListToolbar',
      'Menu',
      'MenuItem',
      'MenuTrigger',
      'Modal',
      'NotificationDot',
      'Pagination',
      'Popover',
      'RadioGroup',
      'SearchBar',
      'SegmentedControl',
      'Select',
      'Skeleton',
      'Slider',
      'Spinner',
      'Stepper',
      'Switch',
      'Tab',
      'Table',
      'Tabs',
      'GitField',
      'Tag',
      'TagInput',
      'Textarea',
      'Toaster',
      'Tooltip',
      'Tree',
      'Panel',
      'UserChip',
      'PageHeader',
      'PageLayout',
      'ListRow',
      'ListCard',
      'CopyButton',
      'CopyField',
      'COPY_FIELD_WRAP_AT',
      'SecretReveal',
      'SaveStatus',
      'IconMarker',
      'StatGrid',
      'StatTile',
      'StatTileLink',
      'SkeletonList',
      'Disclosure',
      'JobStatus',
      'NavTabs',
      'NavTab',
      'AppShellNavGroup',
      'GbtToastService',
    ]) {
      expect(api).toHaveProperty(name)
    }
  })

  it('exports the default copy-field wrap pattern as a RegExp', () => {
    expect(api.COPY_FIELD_WRAP_AT).toBeInstanceOf(RegExp)
  })

  it('exposes the version', () => {
    expect(api.GABARIT_VERSION).toBe('2.2.1')
  })

  it('exports the thirteen dataviz primitives', () => {
    for (const name of [
      'linearScale',
      'timeScale',
      'bandScale',
      'niceTicks',
      'timeTicks',
      'formatNumber',
      'formatCompact',
      'formatDuration',
      'formatPercent',
      'linePath',
      'areaPath',
      'arcPath',
      'nearestIndex',
    ]) {
      expect(api).toHaveProperty(name)
    }
  })

  it('exports the formatting primitives added in 1.2.0', () => {
    for (const name of [
      'formatBytes',
      'formatRelativeTime',
      'formatDateTime',
      'computeInitials',
      'createListToolbarState',
      'GbtRelativeTimePipe',
      'GbtBytesPipe',
      'GbtDateTimePipe',
    ]) {
      expect(api).toHaveProperty(name)
    }
  })

  it('exports the chart base and its five building blocks', () => {
    for (const name of [
      'ChartFrame',
      'ChartAxis',
      'ChartTooltip',
      'ChartLegend',
      'ChartEmpty',
      'ChartTable',
      'CHART_CONTEXT',
    ]) {
      expect(api).toHaveProperty(name)
    }
  })

  it("exports PointValue, the type of pointValues' x-values", () => {
    const verified: import('../public-api').PointValue = 0
    expect(verified).toBe(0)
  })

  it('exports SearchBarCollapsible, the type of the collapsible input', () => {
    const modes: import('../public-api').SearchBarCollapsible[] = [true, false, 'narrow']
    expect(modes).toHaveLength(3)
  })

  it("doesn't expose the mutable context class", () => {
    expect(api).not.toHaveProperty('ChartContext')
  })

  it('exports the three cartesian charts and their traces', () => {
    for (const name of [
      'LineChart',
      'BarChart',
      'TimelineChart',
      'LineSeries',
      'BarSeries',
      'TimelineSeries',
    ]) {
      expect(api).toHaveProperty(name)
    }
  })

  it('exports the five standalone charts', () => {
    for (const name of ['Sparkline', 'GaugeBar', 'DimensionCard', 'FunnelChart', 'PieChart']) {
      expect(api).toHaveProperty(name)
    }
  })

  it('exports the two rounded-domain calculations', () => {
    for (const name of ['niceXDomain', 'niceYDomain']) {
      expect(api).toHaveProperty(name)
    }
  })

  it('exports the auth kit: its pages, pieces, ports and helpers', () => {
    for (const name of [
      'AuthPanel',
      'AuthFooter',
      'AuthFooterLink',
      'TotpQr',
      'TOTP_QR_RENDERER',
      'BackupCodes',
      'MfaEnrollment',
      'AuthLogin',
      'AuthRegister',
      'AuthActivate',
      'AuthResetPassword',
      'MfaSettings',
      'PasskeySettings',
      'MfaSettingsState',
      'AUTH_PORT',
      'MFA_PORT',
      'AUTH_LABELS',
      'provideAuthLabels',
      'DEFAULT_TOTP_QR_LABELS',
      'DEFAULT_BACKUP_CODES_LABELS',
      'DEFAULT_MFA_ENROLLMENT_LABELS',
      'DEFAULT_LOGIN_LABELS',
      'DEFAULT_REGISTER_LABELS',
      'DEFAULT_ACTIVATE_LABELS',
      'DEFAULT_RESET_PASSWORD_LABELS',
      'DEFAULT_MFA_SETTINGS_LABELS',
      'DEFAULT_PASSKEY_SETTINGS_LABELS',
      'createPasskeyCredential',
      'getPasskeyAssertion',
      'passkeysSupported',
      'classifyPasskeyError',
      'bufferToBase64Url',
      'base64UrlToBuffer',
      'AUTH_PORT_ERROR_BODIES',
      'isAuthPortError',
      'portErrorMessage',
      'classifyMfaFailure',
      'classifyPasswordFailure',
      'isTooManyPasskeys',
      'classifyRegisterFailure',
      'classifyActivateFailure',
      'MIN_PASSWORD_LENGTH',
      'USERNAME_PATTERN',
      'usernameProblem',
      'emailProblem',
      'passwordProblem',
      'accountName',
      'ACTIVATION_TOKEN_SHAPE',
      'activationToken',
      'PASSKEY_NAME_MAX',
      'passkeyNameProblem',
    ]) {
      expect(api).toHaveProperty(name)
    }
  })

  it('exports the port interfaces and their DTOs as types', () => {
    const config: import('../public-api').AuthConfig = {
      registrationEnabled: true,
      passkeysAvailable: false,
    }
    const status: import('../public-api').MfaStatus = {
      totpEnabled: false,
      backupCodesRemaining: 0,
      passkeys: [],
    }
    const proof: import('../public-api').MfaProof = { backupCode: 'x' }
    expect([config, status, proof]).toHaveLength(3)
  })

  it("doesn't expose the auth kit's test and story fakes", () => {
    for (const name of ['fakeAuthPort', 'fakeMfaPort', 'storyAuthPort', 'stubPasskeyBrowser']) {
      expect(api).not.toHaveProperty(name)
    }
  })
})
