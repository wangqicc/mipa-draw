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

  describe('基础渲染测试', () => {
    it('renders correctly with toolbar structure', () => {
      expect(wrapper.find('.flex').exists()).toBe(true)
      expect(wrapper.find('.bg-white').exists()).toBe(true)
      expect(wrapper.find('.border-b').exists()).toBe(true)
      expect(wrapper.find('.shadow-sm').exists()).toBe(true)
      expect(wrapper.find('.no-print').exists()).toBe(true)
    })

    it('renders all toolbar buttons', () => {
      const buttons = wrapper.findAll('button')
      
      // 验证主要功能按钮存在
      const undoButton = buttons.find((btn: any) => 
        btn.attributes('title') === '撤销 (Ctrl+Z)'
      )
      const redoButton = buttons.find((btn: any) => 
        btn.attributes('title') === '重做 (Ctrl+Y)'
      )
      const canvasSizeButton = buttons.find((btn: any) => 
        btn.text().includes('画布尺寸')
      )
      const backgroundButton = buttons.find((btn: any) => 
        btn.text().includes('背景设置')
      )
      const gridButton = buttons.find((btn: any) => 
        btn.text().includes('网格')
      )
      const exportButton = buttons.find((btn: any) => 
        btn.text().includes('导出')
      )
      const printButton = buttons.find((btn: any) => 
        btn.text().includes('打印')
      )
      const clearButton = buttons.find((btn: any) => 
        btn.text().includes('清空')
      )

      expect(undoButton).toBeDefined()
      expect(redoButton).toBeDefined()
      expect(canvasSizeButton).toBeDefined()
      expect(backgroundButton).toBeDefined()
      expect(gridButton).toBeDefined()
      expect(exportButton).toBeDefined()
      expect(printButton).toBeDefined()
      expect(clearButton).toBeDefined()
    })

    it('applies correct styling to toolbar buttons', () => {
      const buttons = wrapper.findAll('button')
      const firstButton = buttons[0]
      
      expect(firstButton.classes()).toContain('rounded')
      expect(firstButton.classes()).toContain('hover:bg-gray-100')
      expect(firstButton.classes()).toContain('transition-colors')
    })

    it('renders SVG icons in buttons', () => {
      const buttons = wrapper.findAll('button')
      const firstButton = buttons[0]
      const svg = firstButton.find('svg')
      
      expect(svg.exists()).toBe(true)
      expect(svg.classes()).toContain('w-5')
      expect(svg.classes()).toContain('h-5')
    })
  })

  describe('核心功能测试', () => {
    it('toggles grid visibility', async () => {
      const initialGridState = store.settings.showGrid
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

    it('handles print functionality', () => {
      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})
      wrapper.vm.handlePrint()
      expect(printSpy).toHaveBeenCalled()
      printSpy.mockRestore()
    })

    it('handles clear canvas', () => {
      // 添加测试贴纸
      store.stickers = [
        {
          id: 'test-1',
          type: 'svg',
          src: '<svg><circle cx="50" cy="50" r="40"/></svg>',
          x: 100, y: 100, width: 100, height: 100, rotation: 0, zIndex: 1, name: 'Test'
        }
      ]
      store.selectedStickerIds = ['test-1']
      
      const buttons = wrapper.findAll('button')
      const clearButton = buttons.find((btn: any) => 
        btn.text().includes('清空')
      )
      
      expect(clearButton).toBeDefined()
      clearButton.trigger('click')
      
      expect(store.stickers).toEqual([])
      expect(store.selectedStickerIds).toEqual([])
    })

    it('applies canvas size correctly', async () => {
      wrapper.vm.showSizeModal = true
      wrapper.vm.canvasWidth = 1200
      wrapper.vm.canvasHeight = 800
      
      await wrapper.vm.$nextTick()
      wrapper.vm.applySize()
      
      expect(store.settings.width).toBe(1200)
      expect(store.settings.height).toBe(800)
      expect(wrapper.vm.showSizeModal).toBe(false)
    })

    it('handles undo operation', () => {
      const buttons = wrapper.findAll('button')
      const undoButton = buttons.find((btn: any) => 
        btn.attributes('title') === '撤销 (Ctrl+Z)'
      )
      expect(undoButton).toBeDefined()
      undoButton.trigger('click')
    })

    it('handles redo operation', () => {
      const buttons = wrapper.findAll('button')
      const redoButton = buttons.find((btn: any) => 
        btn.attributes('title') === '重做 (Ctrl+Y)'
      )
      expect(redoButton).toBeDefined()
      redoButton.trigger('click')
    })
  })

  describe('背景设置面板测试', () => {
    beforeEach(async () => {
      wrapper.vm.showBackgroundPanel = true
      await wrapper.vm.$nextTick()
    })

    it('renders background panel with all sections', () => {
      expect(wrapper.text()).toContain('背景设置')
      expect(wrapper.text()).toContain('纯色背景')
      expect(wrapper.text()).toContain('渐变背景')
      expect(wrapper.text()).toContain('图片背景')
      expect(wrapper.text()).toContain('网格设置')
    })

    it('handles solid color selection', async () => {
      const colorButtons = wrapper.findAll('.grid button')
      expect(colorButtons.length).toBeGreaterThan(0)
      
      const firstColorButton = colorButtons[0]
      await firstColorButton.trigger('click')
      
      expect(store.settings.backgroundGradient).toBeUndefined()
      expect(store.settings.backgroundImage).toBeUndefined()
    })

    it('handles gradient selection', async () => {
      const gradientButtons = wrapper.findAll('.grid button')
      expect(gradientButtons.length).toBeGreaterThan(0)
      
      // 选择最后一个渐变按钮（假设渐变在纯色之后）
      const lastButton = gradientButtons[gradientButtons.length - 1]
      await lastButton.trigger('click')
      
      expect(store.settings.backgroundGradient).toBeDefined()
      expect(store.settings.backgroundImage).toBeUndefined()
    })

    it('handles background image upload', async () => {
      // 模拟文件选择和FileReader
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      global.FileReader = function MockFileReader(this: any) {
        this.readAsDataURL = vi.fn(() => {
          if (this.onload) this.onload({ target: { result: 'data:image/jpeg;base64,test' } })
        })
        this.onload = null
        this.onerror = null
        this.result = null
        return this
      } as any

      const fileInput = wrapper.find('input[type="file"]')
      expect(fileInput.exists()).toBe(true)
      expect(fileInput.attributes('accept')).toBe('image/*')
      
      // 模拟文件选择事件
      Object.defineProperty(fileInput.element, 'files', {
        value: [mockFile],
        writable: false
      })
      
      await fileInput.trigger('change')
      expect(store.settings.backgroundImage).toBe('data:image/jpeg;base64,test')
    })

    it('handles background image removal', async () => {
      // 先设置一个图片背景
      store.settings.backgroundImage = 'data:image/jpeg;base64,test'
      await wrapper.vm.$nextTick()

      const clearButton = wrapper.findAll('button').find((btn: any) => 
        btn.text().includes('清除图片背景')
      )
      expect(clearButton).toBeDefined()
      
      if (clearButton) {
        await clearButton.trigger('click')
        expect(store.settings.backgroundImage).toBeUndefined()
      }
    })

    it('handles grid settings in background panel', async () => {
      expect(wrapper.text()).toContain('显示网格')
      expect(wrapper.text()).toContain('网格间距')
      expect(wrapper.text()).toContain('网格颜色')
      
      // 测试网格大小滑块
      const rangeInput = wrapper.find('input[type="range"]')
      expect(rangeInput.exists()).toBe(true)
      expect(rangeInput.attributes('min')).toBe('10')
      expect(rangeInput.attributes('max')).toBe('100')
      expect(rangeInput.attributes('step')).toBe('5')
      
      await rangeInput.setValue(50)
      expect(store.settings.gridSize).toBe(50)
      
      // 测试网格颜色选择器
      const colorInput = wrapper.find('input[type="color"]')
      expect(colorInput.exists()).toBe(true)
      
      await colorInput.setValue('#ff0000')
      expect(store.settings.gridColor).toBe('#ff0000')
    })

    it('handles grid toggle in background panel', async () => {
      const initialGridState = store.settings.showGrid
      
      // 找到网格切换按钮
      const buttons = wrapper.findAll('button')
      const gridToggleButton = buttons.find((btn: any) => 
        btn.classes().includes('relative') && 
        btn.classes().includes('w-10') &&
        btn.classes().includes('h-5')
      )
      
      expect(gridToggleButton).toBeDefined()
      await gridToggleButton.trigger('click')
      expect(store.settings.showGrid).toBe(!initialGridState)
    })

    it('closes background panel when close button is clicked', async () => {
      const closeButton = wrapper.find('.bg-white button.p-1')
      expect(closeButton.exists()).toBe(true)
      
      await closeButton.trigger('click')
      expect(wrapper.vm.showBackgroundPanel).toBe(false)
    })
  })

  describe('导出模态框测试', () => {
    beforeEach(async () => {
      wrapper.vm.showExportModal = true
      await wrapper.vm.$nextTick()
    })

    it('renders export modal with all options', () => {
      expect(wrapper.text()).toContain('导出画布')
      expect(wrapper.text()).toContain('导出为 PNG 图片')
      expect(wrapper.text()).toContain('导出为 SVG 矢量图')
      expect(wrapper.text()).toContain('打印')
      expect(wrapper.text()).toContain('取消')
    })

    it('handles PNG export', async () => {
      // 模拟canvas元素
      const mockCanvasElement = document.createElement('div')
      mockCanvasElement.className = 'canvas-shadow'
      document.body.appendChild(mockCanvasElement)

      const exportButton = wrapper.findAll('button').find((btn: any) => 
        btn.text().includes('导出为 PNG 图片')
      )
      expect(exportButton).toBeDefined()
      
      await exportButton.trigger('click')
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(wrapper.vm.showExportModal).toBe(false)
      document.body.removeChild(mockCanvasElement)
    })

    it('handles SVG export', async () => {
      // 添加测试贴纸
      store.stickers = [
        {
          id: 'test-1',
          type: 'svg',
          src: '<svg><circle cx="50" cy="50" r="40" fill="red"/></svg>',
          x: 100, y: 100, width: 100, height: 100, rotation: 0, zIndex: 1, name: '测试贴纸'
        }
      ]

      const exportButton = wrapper.findAll('button').find((btn: any) => 
        btn.text().includes('导出为 SVG 矢量图')
      )
      expect(exportButton).toBeDefined()
      
      // 模拟URL创建
      const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
      const mockRevokeObjectURL = vi.fn()
      global.URL.createObjectURL = mockCreateObjectURL
      global.URL.revokeObjectURL = mockRevokeObjectURL
      
      await exportButton.trigger('click')
      expect(mockCreateObjectURL).toHaveBeenCalled()
    })

    it('handles print functionality from export modal', async () => {
      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})
      
      const printButton = wrapper.findAll('button').find((btn: any) => 
        btn.text().includes('打印')
      )
      expect(printButton).toBeDefined()
      
      await printButton.trigger('click')
      expect(printSpy).toHaveBeenCalled()
      // 打印功能不会关闭模态框
      expect(wrapper.vm.showExportModal).toBe(true)
      
      printSpy.mockRestore()
    })

    it('handles export modal cancel', async () => {
      const cancelButton = wrapper.findAll('button').find((btn: any) => 
        btn.text().includes('取消')
      )
      expect(cancelButton).toBeDefined()
      
      await cancelButton.trigger('click')
      expect(wrapper.vm.showExportModal).toBe(false)
    })

    it('handles empty canvas export gracefully', async () => {
      // 确保没有canvas元素
      const existingCanvas = document.querySelector('.canvas-shadow')
      if (existingCanvas) {
        existingCanvas.remove()
      }

      const exportButton = wrapper.findAll('button').find((btn: any) => 
        btn.text().includes('导出为 PNG 图片')
      )
      expect(exportButton).toBeDefined()
      
      await exportButton.trigger('click')
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // exportAsImage函数在canvas元素不存在时会提前返回，不会关闭模态框
      expect(wrapper.vm.showExportModal).toBe(true)
    })

    it('handles empty stickers SVG export', async () => {
      // 确保没有贴纸
      store.stickers = []

      const exportButton = wrapper.findAll('button').find((btn: any) => 
        btn.text().includes('导出为 SVG 矢量图')
      )
      expect(exportButton).toBeDefined()
      
      // 模拟URL创建
      const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
      const mockRevokeObjectURL = vi.fn()
      global.URL.createObjectURL = mockCreateObjectURL
      global.URL.revokeObjectURL = mockRevokeObjectURL
      
      await exportButton.trigger('click')
      expect(mockCreateObjectURL).toHaveBeenCalled()
    })
  })

  describe('尺寸设置模态框测试', () => {
    beforeEach(async () => {
      wrapper.vm.showSizeModal = true
      await wrapper.vm.$nextTick()
    })

    it('handles canvas size application', async () => {
      wrapper.vm.canvasWidth = 1920
      wrapper.vm.canvasHeight = 1080
      await wrapper.vm.$nextTick()

      const applyButton = wrapper.findAll('button').find((btn: any) => 
        btn.text().includes('应用')
      )
      expect(applyButton).toBeDefined()
      
      if (applyButton) {
        await applyButton.trigger('click')
        expect(store.settings.width).toBe(1920)
        expect(store.settings.height).toBe(1080)
        expect(wrapper.vm.showSizeModal).toBe(false)
      }
    })

    it('handles canvas size cancellation', async () => {
      wrapper.vm.canvasWidth = 999
      wrapper.vm.canvasHeight = 999
      await wrapper.vm.$nextTick()

      const cancelButton = wrapper.findAll('button').find((btn: any) => 
        btn.text().includes('取消')
      )
      expect(cancelButton).toBeDefined()
      
      if (cancelButton) {
        await cancelButton.trigger('click')
        expect(wrapper.vm.showSizeModal).toBe(false)
        // 尺寸应该保持不变
        expect(store.settings.width).not.toBe(999)
        expect(store.settings.height).not.toBe(999)
      }
    })
  })

  describe('错误处理和边界条件测试', () => {
    it('handles file upload error gracefully', async () => {
      wrapper.vm.showBackgroundPanel = true
      await wrapper.vm.$nextTick()

      // 模拟FileReader错误
      global.FileReader = function MockFileReader(this: any) {
        this.readAsDataURL = vi.fn(() => {
          if (this.onerror) this.onerror(new Error('File read error'))
        })
        this.onload = null
        this.onerror = null
        this.result = null
        return this
      } as any

      const fileInput = wrapper.find('input[type="file"]')
      expect(fileInput.exists()).toBe(true)
      
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(fileInput.element, 'files', {
        value: [mockFile],
        writable: false
      })
      
      await fileInput.trigger('change')
      // 验证错误被处理，背景图片未被设置
      expect(store.settings.backgroundImage).toBeUndefined()
    })
  })

  describe('UI状态验证测试', () => {
    it('displays selected background state correctly', async () => {
      wrapper.vm.showBackgroundPanel = true
      await wrapper.vm.$nextTick()

      // 设置白色纯色背景
      store.settings.backgroundColor = '#ffffff'
      store.settings.backgroundGradient = undefined
      store.settings.backgroundImage = undefined
      await wrapper.vm.$nextTick()

      // 验证第一个颜色按钮（白色）有选中状态样式
      const colorButtons = wrapper.findAll('.grid button')
      expect(colorButtons.length).toBeGreaterThan(0)
      
      const firstColorButton = colorButtons[0]
      const style = firstColorButton.attributes('style')
      // 检查背景颜色，支持rgb(255,255,255)或#ffffff格式
      const hasWhiteBackground = style.includes('rgb(255, 255, 255)') || style.includes('#ffffff')
      expect(hasWhiteBackground).toBe(true)
      
      // 验证选中状态的样式
      expect(firstColorButton.classes()).toContain('border-blue-500')
      expect(firstColorButton.classes()).toContain('ring-2')
      expect(firstColorButton.classes()).toContain('ring-blue-200')
    })

    it('displays toggle button state correctly', async () => {
      wrapper.vm.showBackgroundPanel = true
      await wrapper.vm.$nextTick()

      // 找到网格切换按钮
      const buttons = wrapper.findAll('button')
      const gridToggleButton = buttons.find((btn: any) => 
        btn.classes().includes('relative') && 
        btn.classes().includes('w-10') &&
        btn.classes().includes('h-5')
      )
      
      expect(gridToggleButton).toBeDefined()
      const initialState = store.settings.showGrid
      
      // 检查开关的视觉状态
      const switchHandle = gridToggleButton.find('span')
      expect(switchHandle.exists()).toBe(true)
      
      if (initialState) {
        expect(gridToggleButton.classes()).toContain('bg-blue-600')
        expect(switchHandle.classes()).toContain('translate-x-5')
      } else {
        expect(gridToggleButton.classes()).toContain('bg-gray-300')
        expect(switchHandle.classes()).not.toContain('translate-x-5')
      }
    })
  })
})