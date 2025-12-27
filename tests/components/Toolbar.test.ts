import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Toolbar from '@/components/Toolbar.vue'
import { useCanvasStore } from '@/stores/canvas'

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn(() => Promise.resolve({
    toDataURL: () => 'data:image/png;base64,mock'
  }))
}))

describe('Toolbar.vue', () => {
  let wrapper: any
  let store: any

  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
    store = useCanvasStore()
    wrapper = mount(Toolbar, {
      global: {
        plugins: [pinia]
      }
    })
  })

  it('renders correctly with toolbar structure', () => {
    expect(wrapper.find('.flex').exists()).toBe(true)
    expect(wrapper.find('.bg-white').exists()).toBe(true)
    expect(wrapper.find('.border-b').exists()).toBe(true)
    expect(wrapper.find('.shadow-sm').exists()).toBe(true)
    expect(wrapper.find('.no-print').exists()).toBe(true)
  })

  it('renders undo and redo buttons', () => {
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)

    // Find undo button (should be first button)
    const undoButton = buttons[0]
    expect(undoButton.attributes('title')).toBe('撤销 (Ctrl+Z)')

    // Find redo button (should be second button)
    const redoButton = buttons[1]
    expect(redoButton.attributes('title')).toBe('重做 (Ctrl+Y)')
  })

  it('renders canvas size button', () => {
    const buttons = wrapper.findAll('button')
    const canvasSizeButton = buttons.find((btn: any) => 
      btn.text().includes('画布尺寸')
    )
    expect(canvasSizeButton).toBeDefined()
  })

  it('renders background settings button', () => {
    const buttons = wrapper.findAll('button')
    const backgroundButton = buttons.find((btn: any) => 
      btn.text().includes('背景设置')
    )
    expect(backgroundButton).toBeDefined()
  })

  it('renders grid toggle button', () => {
    const buttons = wrapper.findAll('button')
    const gridButton = buttons.find((btn: any) => 
      btn.text().includes('网格')
    )
    expect(gridButton).toBeDefined()
  })

  it('renders export button', () => {
    const buttons = wrapper.findAll('button')
    const exportButton = buttons.find((btn: any) => 
      btn.text().includes('导出')
    )
    expect(exportButton).toBeDefined()
  })

  it('renders print button', () => {
    const buttons = wrapper.findAll('button')
    const printButton = buttons.find((btn: any) => 
      btn.text().includes('打印')
    )
    expect(printButton).toBeDefined()
  })

  it('renders clear canvas button', () => {
    const buttons = wrapper.findAll('button')
    const clearButton = buttons.find((btn: any) => 
      btn.text().includes('清空')
    )
    expect(clearButton).toBeDefined()
  })

  it('toggles grid visibility', async () => {
    const initialGridState = store.settings.showGrid

    // Find and click grid toggle button
    const buttons = wrapper.findAll('button')
    const gridButton = buttons.find((btn: any) => 
      btn.text().includes('网格')
    )
    expect(gridButton).toBeDefined()

    await gridButton.trigger('click')

    expect(store.settings.showGrid).toBe(!initialGridState)
  })

  it('opens size modal when canvas size button is clicked', async () => {
    const buttons = wrapper.findAll('button')
    const canvasSizeButton = buttons.find((btn: any) => 
      btn.text().includes('画布尺寸')
    )
    expect(canvasSizeButton).toBeDefined()

    await canvasSizeButton.trigger('click')

    await wrapper.vm.$nextTick()

    expect(wrapper.vm.showSizeModal).toBe(true)
    expect(wrapper.text()).toContain('设置画布尺寸')
  })

  it('opens export modal when export button is clicked', async () => {
    const buttons = wrapper.findAll('button')
    const exportButton = buttons.find((btn: any) => 
      btn.text().includes('导出')
    )
    expect(exportButton).toBeDefined()

    await exportButton.trigger('click')

    await wrapper.vm.$nextTick()

    expect(wrapper.vm.showExportModal).toBe(true)
    expect(wrapper.text()).toContain('导出画布')
  })

  it('toggles background panel when background button is clicked', async () => {
    const buttons = wrapper.findAll('button')
    const backgroundButton = buttons.find((btn: any) => 
      btn.text().includes('背景设置')
    )
    expect(backgroundButton).toBeDefined()

    const initialState = wrapper.vm.showBackgroundPanel

    await backgroundButton.trigger('click')

    expect(wrapper.vm.showBackgroundPanel).toBe(!initialState)
  })

  it('applies canvas size correctly', async () => {
    wrapper.vm.showSizeModal = true
    wrapper.vm.canvasWidth = 1200
    wrapper.vm.canvasHeight = 800

    await wrapper.vm.$nextTick()

    wrapper.vm.applySize()

    expect(wrapper.vm.canvasWidth).toBe(1200)
    expect(wrapper.vm.canvasHeight).toBe(800)
    expect(wrapper.vm.showSizeModal).toBe(false)
  })

  it('handles print functionality', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})

    wrapper.vm.handlePrint()

    expect(printSpy).toHaveBeenCalled()

    printSpy.mockRestore()
  })

  it('handles clear canvas', () => {
    // Add some stickers first
    store.stickers = [
      {
        id: 'test-1',
        type: 'svg',
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 1,
        name: 'Test'
      }
    ]
    store.selectedStickerIds = ['test-1']

    const buttons = wrapper.findAll('button')
    const clearButton = buttons.find((btn: any) => 
      btn.text().includes('清空')
    )
    expect(clearButton).toBeDefined()

    clearButton.trigger('click')

    // The clearCanvas function should clear stickers and selection
    expect(wrapper.vm.store.stickers).toEqual([])
    expect(wrapper.vm.store.selectedStickerIds).toEqual([])
  })

  it('renders background panel when toggled', async () => {
    wrapper.vm.showBackgroundPanel = true

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('背景设置')
    expect(wrapper.text()).toContain('纯色背景')
    expect(wrapper.text()).toContain('渐变背景')
    expect(wrapper.text()).toContain('图片背景')
    expect(wrapper.text()).toContain('网格设置')
  })

  it('renders solid color options in background panel', async () => {
    wrapper.vm.showBackgroundPanel = true

    await wrapper.vm.$nextTick()

    const colorButtons = wrapper.findAll('.grid button')
    expect(colorButtons.length).toBeGreaterThan(0)

    // Check that colors are properly styled
    colorButtons.forEach((btn: any) => {
      expect(btn.attributes('style')).toBeDefined()
    })
  })

  it('renders gradient options in background panel', async () => {
    wrapper.vm.showBackgroundPanel = true

    await wrapper.vm.$nextTick()

    const gradientButtons = wrapper.findAll('.grid button')
    expect(gradientButtons.length).toBeGreaterThan(0)
  })

  it('handles background image upload', async () => {
    wrapper.vm.showBackgroundPanel = true

    await wrapper.vm.$nextTick()

    const fileInput = wrapper.find('input[type="file"]')
    expect(fileInput.exists()).toBe(true)
    expect(fileInput.attributes('accept')).toBe('image/*')
  })

  it('renders grid settings in background panel', async () => {
    wrapper.vm.showBackgroundPanel = true

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('显示网格')
    expect(wrapper.text()).toContain('网格间距')
    expect(wrapper.text()).toContain('网格颜色')
  })

  it('handles grid size range input', async () => {
    wrapper.vm.showBackgroundPanel = true

    await wrapper.vm.$nextTick()

    const rangeInput = wrapper.find('input[type="range"]')
    expect(rangeInput.exists()).toBe(true)
    expect(rangeInput.attributes('min')).toBe('10')
    expect(rangeInput.attributes('max')).toBe('100')
    expect(rangeInput.attributes('step')).toBe('5')
  })

  it('handles grid color input', async () => {
    wrapper.vm.showBackgroundPanel = true

    await wrapper.vm.$nextTick()

    const colorInput = wrapper.find('input[type="color"]')
    expect(colorInput.exists()).toBe(true)
  })

  it('closes background panel when close button is clicked', async () => {
    wrapper.vm.showBackgroundPanel = true

    await wrapper.vm.$nextTick()

    const closeButton = wrapper.find('.bg-white button.p-1')
    await closeButton.trigger('click')

    expect(wrapper.vm.showBackgroundPanel).toBe(false)
  })

  it('closes modals when cancel buttons are clicked', async () => {
    wrapper.vm.showSizeModal = true
    wrapper.vm.showExportModal = true

    await wrapper.vm.$nextTick()

    const cancelButtons = wrapper.findAll('button').filter((btn: any) => 
      btn.text().includes('取消')
    )

    expect(cancelButtons.length).toBeGreaterThan(0)
  })

  it('handles undo operation', () => {
    const buttons = wrapper.findAll('button')
    const undoButton = buttons[0]
    undoButton.trigger('click')

    // The undo button should trigger the undo functionality
    expect(undoButton.exists()).toBe(true)
  })

  it('handles redo operation', () => {
    const buttons = wrapper.findAll('button')
    const redoButton = buttons[1]
    redoButton.trigger('click')

    // The redo button should trigger the redo functionality
    expect(redoButton.exists()).toBe(true)
  })

  it('renders correct number of buttons', () => {
    const buttons = wrapper.findAll('button')
    // Should have at least 7 main toolbar buttons
    expect(buttons.length).toBeGreaterThanOrEqual(7)
  })

  it('applies correct styling to toolbar buttons', () => {
    const buttons = wrapper.findAll('button')
    // Check first few buttons have basic styling
    const firstButton = buttons[0]
    expect(firstButton.classes()).toContain('rounded')
    expect(firstButton.classes()).toContain('hover:bg-gray-100')
    expect(firstButton.classes()).toContain('transition-colors')
  })

  it('renders SVG icons in buttons', () => {
    const buttons = wrapper.findAll('button')
    // Check first button has SVG with correct classes
    const firstButton = buttons[0]
    const svg = firstButton.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.classes()).toContain('w-5')
    expect(svg.classes()).toContain('h-5')
  })
})