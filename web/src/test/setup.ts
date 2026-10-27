import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'

// Toasts are checked through these mocks: expect(toast.success).toHaveBeenCalledWith(...)
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() }, Toaster: () => null }))

// jsdom doesn't implement the modal methods of <dialog>
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function () {
    if (!this.open) return
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})
