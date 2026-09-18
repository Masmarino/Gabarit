import {
  addMonths,
  addYears,
  buildCalendarGrid,
  isSameDay,
  startOfWeek,
} from './date-picker-calendar'

describe('isSameDay', () => {
  it('is true for the same calendar day regardless of time', () => {
    expect(isSameDay(new Date(2024, 2, 15, 8, 0), new Date(2024, 2, 15, 23, 59))).toBe(true)
  })

  it('is false for different days', () => {
    expect(isSameDay(new Date(2024, 2, 15), new Date(2024, 2, 16))).toBe(false)
  })

  it('is false for the same day/month in a different year', () => {
    expect(isSameDay(new Date(2024, 2, 15), new Date(2023, 2, 15))).toBe(false)
  })
})

describe('addMonths', () => {
  it('adds whole months, keeping the day of month', () => {
    expect(addMonths(new Date(2024, 0, 15), 2)).toEqual(new Date(2024, 2, 15))
  })

  it('rolls over into the next year', () => {
    expect(addMonths(new Date(2024, 11, 15), 1)).toEqual(new Date(2025, 0, 15))
  })

  it('clamps an overflowing day to the shorter target month, instead of rolling into the month after', () => {
    // Jan 31 + 1 month must land on Feb 29 (2024 is a leap year), never March 2
    expect(addMonths(new Date(2024, 0, 31), 1)).toEqual(new Date(2024, 1, 29))
  })
})

describe('addYears', () => {
  it('adds whole years, keeping month and day', () => {
    expect(addYears(new Date(2024, 5, 10), 1)).toEqual(new Date(2025, 5, 10))
  })

  it('clamps Feb 29 on a leap year to Feb 28 on a non-leap target year', () => {
    expect(addYears(new Date(2024, 1, 29), 1)).toEqual(new Date(2025, 1, 28))
  })
})

describe('startOfWeek', () => {
  it('finds the preceding Monday when weekStartsOn is 1', () => {
    // Wednesday March 13 2024
    expect(startOfWeek(new Date(2024, 2, 13), 1)).toEqual(new Date(2024, 2, 11))
  })

  it('returns the same date if it already is the start of the week', () => {
    expect(startOfWeek(new Date(2024, 2, 11), 1)).toEqual(new Date(2024, 2, 11))
  })

  it('finds the preceding Sunday when weekStartsOn is 0', () => {
    expect(startOfWeek(new Date(2024, 2, 13), 0)).toEqual(new Date(2024, 2, 10))
  })
})

describe('buildCalendarGrid', () => {
  it('always returns 42 days (6 full weeks)', () => {
    expect(buildCalendarGrid(2024, 2, 1)).toHaveLength(42)
  })

  it('starts on the Monday on/before the 1st of the month', () => {
    // March 2024: the 1st is a Friday, so the grid starts Monday Feb 26
    const grid = buildCalendarGrid(2024, 2, 1)
    expect(grid[0].date).toEqual(new Date(2024, 1, 26))
  })

  it('marks days outside the target month', () => {
    const grid = buildCalendarGrid(2024, 2, 1)
    expect(grid[0].inCurrentMonth).toBe(false) // Feb 26
    expect(grid.find((d) => d.date.getDate() === 1 && d.date.getMonth() === 2)?.inCurrentMonth).toBe(
      true,
    )
  })

  it('marks exactly one day as today, when today falls within the grid', () => {
    const today = new Date()
    const grid = buildCalendarGrid(today.getFullYear(), today.getMonth(), 1)
    const todays = grid.filter((d) => d.isToday)
    expect(todays).toHaveLength(1)
    expect(isSameDay(todays[0].date, today)).toBe(true)
  })

  it('produces consecutive calendar days with no gaps, safe across a DST transition', () => {
    // The grid for March 2024 (US) spans the March 10 spring-forward
    // transition, so a raw millisecond diff between local midnights would be
    // 23h on that one day — comparing calendar dates instead sidesteps that.
    const grid = buildCalendarGrid(2024, 2, 1)
    for (let i = 1; i < grid.length; i++) {
      const expected = new Date(grid[i - 1].date)
      expected.setDate(expected.getDate() + 1)
      expect(isSameDay(grid[i].date, expected)).toBe(true)
    }
  })
})
