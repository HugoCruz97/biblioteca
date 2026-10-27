import { describe, expect, it } from 'vitest'
import { formatDate, plural } from './format'

describe('formatDate', () => {
  it('keeps a date-only value on the same day', () => {
    // new Date('2026-10-12') is midnight UTC, which is still the 11th in Brazil
    expect(formatDate('2026-10-12')).toMatch(/^12 de out/)
  })

  it('formats datetimes in the local time zone', () => {
    expect(formatDate('2026-10-12T01:00:00Z')).toMatch(/^11 de out/)
  })
})

describe('plural', () => {
  it('picks the form from the count', () => {
    expect(plural(1, 'dia')).toBe('1 dia')
    expect(plural(0, 'dia')).toBe('0 dias')
    expect(plural(2, 'empréstimo atrasado', 'empréstimos atrasados')).toBe('2 empréstimos atrasados')
  })
})
