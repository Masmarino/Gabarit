import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { GABARIT_VERSION } from './version'

describe('GABARIT_VERSION', () => {
  it('exposes a semver-formatted version', () => {
    expect(GABARIT_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('matches the published package version', () => {
    const pkg = JSON.parse(
      readFileSync(join(process.cwd(), 'projects/gabarit/package.json'), 'utf8'),
    ) as {
      version: string
    }
    expect(GABARIT_VERSION).toBe(pkg.version)
  })
})
