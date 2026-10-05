import { computeInitials } from './initials'

describe('computeInitials', () => {
  it.each([
    ['Ada Lovelace', 'AL'],
    ['Ada Marie Lovelace', 'AL'],
    ['ada lovelace', 'AL'],
    ['Ada', 'AD'],
    ['a', 'A'],
    ['  Ada   Lovelace  ', 'AL'],
    ['Jean-Pierre Dupont', 'JD'],
    ['élodie Émile', 'ÉÉ'],
    ['', ''],
    ['   ', ''],
  ])('computeInitials(%j) is %j', (name, expected) => {
    expect(computeInitials(name)).toBe(expected)
  })
})
