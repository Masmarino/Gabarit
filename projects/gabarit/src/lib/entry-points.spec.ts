import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'

/**
 * Each component is its own entry point (`@masmarino/gabarit/<folder>`), so that an application's bundler keeps out of
 * its first chunk what only a lazy page uses: esbuild splits by file, and an entry point is one file. These checks keep
 * the split from leaking.
 */
const PACKAGE = join(process.cwd(), 'projects/gabarit')
const ENTRIES = readdirSync(PACKAGE).filter((name) =>
  existsSync(join(PACKAGE, name, 'ng-package.json')),
)

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return name === 'testing' ? [] : sources(full)
    return name.endsWith('.ts') && !/\.(spec|stories)\.ts$/.test(name) ? [full] : []
  })
}

describe('entry points', () => {
  it('has one per component folder, and the docs', () => {
    expect(ENTRIES.length).toBeGreaterThan(80)
    expect(ENTRIES).toContain('button')
    expect(ENTRIES).toContain('auth-login')
    expect(ENTRIES).toContain('docs')
  })

  it('never reaches into another entry point by a relative path: that would copy its code into this one', () => {
    const leaks: string[] = []
    for (const entry of ENTRIES) {
      const root = join(PACKAGE, entry)
      for (const file of sources(root)) {
        for (const [, spec] of readFileSync(file, 'utf8').matchAll(/from '(\.[^']*)'/g)) {
          const target = resolve(dirname(file), spec)
          if (!target.startsWith(root + sep)) leaks.push(`${relative(PACKAGE, file)} → ${spec}`)
        }
      }
    }
    expect(leaks).toEqual([])
  })

  it('re-exports from the root only what the entry points export, through their package path', () => {
    const api = readFileSync(join(PACKAGE, 'src/public-api.ts'), 'utf8')
    const paths = [...api.matchAll(/from '([^']+)'/g)].map((m) => m[1])
    for (const path of paths) {
      if (path === './lib/version') continue
      expect(path).toMatch(/^@masmarino\/gabarit\/[a-z-]+$/)
      expect(ENTRIES).toContain(path.replace('@masmarino/gabarit/', ''))
    }
  })
})
