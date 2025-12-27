// Test setup file
import { vi } from 'vitest'

// Mock crypto.randomUUID for tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)
  },
  writable: true,
  configurable: true
})

// Mock FileReader for tests - use a proper constructor
class MockFileReader {
  onload: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null
  result: string | null = null

  readAsDataURL(file: File) {
    // Simulate async file reading
    setTimeout(() => {
      this.result = 'data:image/png;base64,mock'
      if (this.onload) {
        this.onload({ target: { result: this.result } })
      }
    }, 0)
  }
}

Object.defineProperty(global, 'FileReader', {
  value: MockFileReader,
  writable: true,
  configurable: true
})

// Mock DOM methods that might be missing
Object.defineProperty(window, 'innerWidth', {
  value: 1024,
  writable: true,
  configurable: true
})

Object.defineProperty(window, 'innerHeight', {
  value: 768,
  writable: true,
  configurable: true
})

// Mock document methods if needed
Object.defineProperty(document, 'createRange', {
  value: () => ({
    setStart: vi.fn(),
    setEnd: vi.fn(),
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }),
    getClientRects: () => []
  }),
  writable: true,
  configurable: true
})

// Mock window.print
Object.defineProperty(window, 'print', {
  value: vi.fn(),
  writable: true,
  configurable: true
})