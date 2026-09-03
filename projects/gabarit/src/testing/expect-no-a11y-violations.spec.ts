import { expectNoA11yViolations } from './expect-no-a11y-violations'

describe('expectNoA11yViolations', () => {
  it('fails on a button with no accessible name', async () => {
    const el = document.createElement('div')
    el.innerHTML = '<button></button>'
    document.body.appendChild(el)
    await expect(expectNoA11yViolations(el)).rejects.toThrow(/button-name/)
    el.remove()
  })

  it('passes on a correctly labeled button', async () => {
    const el = document.createElement('div')
    el.innerHTML = '<button>Enregistrer</button>'
    document.body.appendChild(el)
    await expect(expectNoA11yViolations(el)).resolves.toBeUndefined()
    el.remove()
  })
})
