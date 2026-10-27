import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDebounced } from './use-debounced'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useDebounced', () => {
  it('only updates after the value stops changing for the delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounced(value, 300), { initialProps: { value: 'd' } })

    rerender({ value: 'do' })
    act(() => vi.advanceTimersByTime(200))
    rerender({ value: 'dom' })
    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe('d')

    act(() => vi.advanceTimersByTime(100))
    expect(result.current).toBe('dom')
  })
})
