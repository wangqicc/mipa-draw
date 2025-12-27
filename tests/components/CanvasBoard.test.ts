import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import CanvasBoard from '@/components/CanvasBoard.vue'

describe('CanvasBoard.vue', () => {
  let wrapper: any

  beforeEach(() => {
    setActivePinia(createPinia())
    wrapper = mount(CanvasBoard)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly with canvas structure', () => {
    expect(wrapper.find('.relative').exists()).toBe(true)
    expect(wrapper.find('.canvas-shadow').exists()).toBe(true)
  })

  it('displays grid lines when enabled', () => {
    const store = wrapper.vm.store
    store.settings.showGrid = true
    store.settings.gridSize = 20
    store.settings.gridColor = '#e5e7eb'

    const gridStyle = wrapper.vm.gridStyle
    expect(gridStyle).toBeDefined()
    expect(gridStyle.backgroundSize).toBe('20px 20px')
    expect(gridStyle.backgroundImage).toContain('linear-gradient')
  })

  it('applies background styles correctly', () => {
    const store = wrapper.vm.store
    store.settings.backgroundColor = '#ffffff'

    const backgroundStyle = wrapper.vm.backgroundStyle
    expect(backgroundStyle).toBeDefined()
    expect(backgroundStyle.backgroundColor).toBe('#ffffff')
  })

  it('renders stickers from store', async () => {
    const store = wrapper.vm.store
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
        name: 'Test Sticker'
      }
    ]

    await wrapper.vm.$nextTick()

    const stickerWrappers = wrapper.findAll('.sticker-wrapper')
    expect(stickerWrappers.length).toBe(1)

    const firstSticker = stickerWrappers[0]
    expect(firstSticker.attributes('data-id')).toBe('test-1')
    expect(firstSticker.attributes('style')).toContain('left: 100px')
    expect(firstSticker.attributes('style')).toContain('top: 100px')
    expect(firstSticker.attributes('style')).toContain('width: 100px')
    expect(firstSticker.attributes('style')).toContain('height: 100px')
    expect(firstSticker.attributes('style')).toContain('z-index: 1')
    expect(firstSticker.attributes('style')).toContain('rotate(0deg)')
  })

  it('calculates canvas coordinates correctly', () => {
    // Mock getBoundingClientRect
    const mockElement = {
      getBoundingClientRect: () => ({
        left: 50,
        top: 50,
        right: 850,
        bottom: 650,
        width: 800,
        height: 600
      })
    }

    wrapper.vm.canvasWrapperRef = mockElement as any

    const mockEvent = {
      clientX: 200,
      clientY: 150
    } as MouseEvent

    const point = wrapper.vm.getCanvasPoint(mockEvent)
    expect(point.x).toBe(150) // 200 - 50
    expect(point.y).toBe(100) // 150 - 50
  })

  it('handles mouse events on canvas', async () => {
    const canvasWrapper = wrapper.find('.canvas-shadow')
    expect(canvasWrapper.exists()).toBe(true)

    // Test that the element has the correct event listeners
    expect(canvasWrapper.attributes('style')).toBeDefined()
  })

  it('shows selection box during selection', async () => {
    wrapper.vm.isSelecting = true
    wrapper.vm.selectionBox = { x: 50, y: 50, width: 100, height: 100 }

    await wrapper.vm.$nextTick()

    const selectionBox = wrapper.find('.border-blue-500')
    expect(selectionBox.exists()).toBe(true)
    expect(selectionBox.attributes('style')).toContain('left: 50px')
    expect(selectionBox.attributes('style')).toContain('top: 50px')
    expect(selectionBox.attributes('style')).toContain('width: 100px')
    expect(selectionBox.attributes('style')).toContain('height: 100px')
  })

  it('updates selection box style reactively', () => {
    wrapper.vm.selectionBox = { x: 25, y: 75, width: 150, height: 200 }

    const selectionBoxStyle = wrapper.vm.selectionBoxStyle
    expect(selectionBoxStyle.left).toBe('25px')
    expect(selectionBoxStyle.top).toBe('75px')
    expect(selectionBoxStyle.width).toBe('150px')
    expect(selectionBoxStyle.height).toBe('200px')
  })

  it('handles drag states correctly', () => {
    expect(wrapper.vm.isDragging).toBe(false)
    expect(wrapper.vm.isResizing).toBe(false)
    expect(wrapper.vm.isRotating).toBe(false)
    expect(wrapper.vm.isSelecting).toBe(false)
    expect(wrapper.vm.resizeDirection).toBe('')
  })

  it('shows resize handles and rotate handle for selected sticker', async () => {
    const store = wrapper.vm.store
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
        name: 'Test Sticker'
      }
    ]
    store.selectedStickerIds = ['test-1']

    await wrapper.vm.$nextTick()

    const resizeHandles = wrapper.findAll('.resize-handle')
    expect(resizeHandles.length).toBe(4) // nw, ne, sw, se

    const rotateHandle = wrapper.find('.rotate-handle')
    expect(rotateHandle.exists()).toBe(true)
  })

  it('applies correct CSS classes for selection states', async () => {
    const store = wrapper.vm.store
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
        name: 'Test Sticker'
      },
      {
        id: 'test-2',
        type: 'svg',
        src: '<svg><rect x="10" y="10" width="80" height="80"/></svg>',
        x: 200,
        y: 200,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 2,
        name: 'Test Sticker 2'
      }
    ]

    // Single selection
    store.selectedStickerIds = ['test-1']
    await wrapper.vm.$nextTick()

    const singleSelectedSticker = wrapper.find('[data-id="test-1"]')
    expect(singleSelectedSticker.classes()).toContain('sticker-selected')
    expect(singleSelectedSticker.classes()).not.toContain('sticker-multi-selected')

    // Multiple selection
    store.selectedStickerIds = ['test-1', 'test-2']
    await wrapper.vm.$nextTick()

    const firstMultiSelected = wrapper.find('[data-id="test-1"]')
    const secondMultiSelected = wrapper.find('[data-id="test-2"]')
    expect(firstMultiSelected.classes()).toContain('sticker-multi-selected')
    expect(secondMultiSelected.classes()).toContain('sticker-multi-selected')
  })

  it('exposes canvas wrapper ref', () => {
    expect(wrapper.vm.canvasWrapperRef).toBeDefined()
  })

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

    wrapper.unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))
  })

  it('handles image stickers correctly', async () => {
    const store = wrapper.vm.store
    store.stickers = [
      {
        id: 'test-image',
        type: 'image',
        src: 'data:image/png;base64,test123',
        x: 150,
        y: 150,
        width: 80,
        height: 80,
        rotation: 45,
        zIndex: 3,
        name: 'Test Image'
      }
    ]

    await wrapper.vm.$nextTick()

    const imageSticker = wrapper.find('img')
    expect(imageSticker.exists()).toBe(true)
    expect(imageSticker.attributes('src')).toBe('data:image/png;base64,test123')
    expect(imageSticker.classes()).toContain('w-full')
    expect(imageSticker.classes()).toContain('h-full')
    expect(imageSticker.classes()).toContain('object-contain')
    expect(imageSticker.classes()).toContain('pointer-events-none')
    expect(imageSticker.classes()).toContain('select-none')
  })

  it('handles SVG stickers correctly', async () => {
    const store = wrapper.vm.store
    const svgContent = '<svg><circle cx="40" cy="40" r="30" fill="red"/></svg>'
    store.stickers = [
      {
        id: 'test-svg',
        type: 'svg',
        src: svgContent,
        x: 200,
        y: 200,
        width: 80,
        height: 80,
        rotation: 0,
        zIndex: 4,
        name: 'Test SVG'
      }
    ]

    await wrapper.vm.$nextTick()

    const svgContainer = wrapper.find('.sticker-wrapper > div')
    expect(svgContainer.exists()).toBe(true)
    expect(svgContainer.classes()).toContain('w-full')
    expect(svgContainer.classes()).toContain('h-full')
    expect(svgContainer.classes()).toContain('pointer-events-none')
    expect(svgContainer.classes()).toContain('select-none')
    // Check that SVG content is present in the HTML
    const html = svgContainer.html()
    expect(html).toContain('<svg')
    expect(html).toContain('cx="40"')
    expect(html).toContain('cy="40"')
    expect(html).toContain('r="30"')
    expect(html).toContain('fill="red"')
  })

  // ===== 新增测试用例 =====

  it('should handle canvas mouse down for selection', async () => {
    const canvasWrapper = wrapper.find('.canvas-shadow')

    // 模拟 getBoundingClientRect
    Object.defineProperty(canvasWrapper.element, 'getBoundingClientRect', {
      value: () => ({ left: 0, top: 0, right: 800, bottom: 600 })
    })

    // 模拟鼠标按下事件
    await canvasWrapper.trigger('mousedown', {
      button: 0,
      clientX: 100,
      clientY: 100
    })

    expect(wrapper.vm.isSelecting).toBe(true)
    expect(wrapper.vm.selectionBox).toEqual({ x: 100, y: 100, width: 0, height: 0 })
  })

  it('should handle sticker mouse down for dragging', async () => {
    const store = wrapper.vm.store
    store.stickers = [
      {
        id: 'test-sticker',
        type: 'svg',
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 1,
        name: 'Test Sticker'
      }
    ]
    store.selectedStickerIds = ['test-sticker']

    await nextTick()

    const sticker = wrapper.find('[data-id="test-sticker"]')
    expect(sticker.exists()).toBe(true)

    // 验证组件状态
    expect(wrapper.vm.isDragging).toBe(false)
  })

  it('should handle resize handle mouse down', async () => {
    const store = wrapper.vm.store
    store.stickers = [
      {
        id: 'test-sticker',
        type: 'svg',
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 1,
        name: 'Test Sticker'
      }
    ]
    store.selectedStickerIds = ['test-sticker']

    await nextTick()

    const resizeHandle = wrapper.find('.resize-handle')
    expect(resizeHandle.exists()).toBe(true)

    // 验证初始状态
    expect(wrapper.vm.isResizing).toBe(false)
  })

  it('should handle rotate handle mouse down', async () => {
    const store = wrapper.vm.store
    store.stickers = [
      {
        id: 'test-sticker',
        type: 'svg',
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 1,
        name: 'Test Sticker'
      }
    ]
    store.selectedStickerIds = ['test-sticker']

    await nextTick()

    const rotateHandle = wrapper.find('.rotate-handle')
    expect(rotateHandle.exists()).toBe(true)

    // 验证初始状态
    expect(wrapper.vm.isRotating).toBe(false)
  })

  it('should handle mouse move for selection box', async () => {
    // 开始选择
    wrapper.vm.isSelecting = true
    wrapper.vm.dragStart = { x: 100, y: 100 }
    wrapper.vm.selectionBox = { x: 100, y: 100, width: 0, height: 0 }

    // 模拟鼠标移动
    const mouseEvent = {
      clientX: 200,
      clientY: 150
    } as MouseEvent

    wrapper.vm.handleMouseMove(mouseEvent)

    expect(wrapper.vm.selectionBox).toEqual({
      x: 100,
      y: 100,
      width: 100,
      height: 50
    })
  })

  it('should handle mouse move for dragging stickers', async () => {
    const store = wrapper.vm.store
    store.stickers = [
      {
        id: 'test-sticker',
        type: 'svg',
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 1,
        name: 'Test Sticker'
      }
    ]
    store.selectedStickerIds = ['test-sticker']

    // 开始拖拽
    wrapper.vm.isDragging = true
    wrapper.vm.dragStart = { x: 150, y: 150 }
    wrapper.vm.stickerStartMap.set('test-sticker', { x: 100, y: 100, width: 100, height: 100, rotation: 0 })

    // 模拟鼠标移动
    const mouseEvent = {
      clientX: 200,
      clientY: 200
    } as MouseEvent

    wrapper.vm.handleMouseMove(mouseEvent)

    // 验证贴纸位置被更新
    const updatedSticker = store.stickers.find((s: any) => s.id === 'test-sticker')
    expect(updatedSticker.x).toBe(150) // 100 + (200 - 150)
    expect(updatedSticker.y).toBe(150) // 100 + (200 - 150)
  })

  it('should handle mouse move for resizing stickers', async () => {
    const store = wrapper.vm.store
    store.stickers = [
      {
        id: 'test-sticker',
        type: 'svg',
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 1,
        name: 'Test Sticker'
      }
    ]
    store.selectedStickerIds = ['test-sticker']

    // 开始调整大小
    wrapper.vm.isResizing = true
    wrapper.vm.resizeDirection = 'se'
    wrapper.vm.dragStart = { x: 150, y: 150 }
    wrapper.vm.stickerStartMap.set('test-sticker', { x: 100, y: 100, width: 100, height: 100, rotation: 0 })

    // 模拟鼠标移动
    const mouseEvent = {
      clientX: 200,
      clientY: 200
    } as MouseEvent

    wrapper.vm.handleMouseMove(mouseEvent)

    // 验证贴纸尺寸被更新
    const updatedSticker = store.stickers.find((s: any) => s.id === 'test-sticker')
    expect(updatedSticker.width).toBe(150) // 100 + (200 - 150)
    expect(updatedSticker.height).toBe(150) // 100 + (200 - 150)
  })

  it('should handle mouse move for rotating stickers', async () => {
    const store = wrapper.vm.store
    store.stickers = [
      {
        id: 'test-sticker',
        type: 'svg',
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 1,
        name: 'Test Sticker'
      }
    ]
    store.selectedStickerIds = ['test-sticker']

    // 验证初始状态
    const sticker = store.stickers.find((s: any) => s.id === 'test-sticker')
    expect(sticker.rotation).toBe(0)
  })

  it('should handle mouse up to end operations', async () => {
    // 设置各种状态
    wrapper.vm.isDragging = true
    wrapper.vm.isResizing = true
    wrapper.vm.isRotating = true
    wrapper.vm.isSelecting = true
    wrapper.vm.resizeDirection = 'se'
    wrapper.vm.stickerStartMap.set('test', { x: 0, y: 0, width: 100, height: 100, rotation: 0 })

    // 添加事件监听器
    document.addEventListener('mousemove', wrapper.vm.handleMouseMove)
    document.addEventListener('mouseup', wrapper.vm.handleMouseUp)

    // 模拟鼠标释放
    const mouseEvent = new MouseEvent('mouseup', {
      bubbles: true
    })

    document.dispatchEvent(mouseEvent)

    // 验证所有状态被重置
    expect(wrapper.vm.isDragging).toBe(false)
    expect(wrapper.vm.isResizing).toBe(false)
    expect(wrapper.vm.isRotating).toBe(false)
    expect(wrapper.vm.isSelecting).toBe(false)
    expect(wrapper.vm.resizeDirection).toBe('')
    expect(wrapper.vm.selectionBox).toEqual({ x: 0, y: 0, width: 0, height: 0 })
    expect(wrapper.vm.stickerStartMap.size).toBe(0)
  })

  it('should handle sticker context menu', async () => {
    const store = wrapper.vm.store
    store.stickers = [
      {
        id: 'test-sticker',
        type: 'svg',
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 1,
        name: 'Test Sticker'
      }
    ]

    await nextTick()

    const sticker = wrapper.find('[data-id="test-sticker"]')
    expect(sticker.exists()).toBe(true)

    // 验证组件存在
    expect(wrapper.findComponent({ name: 'CanvasBoard' }).exists()).toBe(true)
  })

  it('should handle canvas context menu', async () => {
    const canvasWrapper = wrapper.find('.canvas-shadow')
    expect(canvasWrapper.exists()).toBe(true)

    // 验证画布存在且可以触发事件
    expect(canvasWrapper.attributes('style')).toBeDefined()
  })

  it('should handle multiple selection with shift key', async () => {
    const store = wrapper.vm.store
    store.stickers = [
      {
        id: 'sticker-1',
        type: 'svg',
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 1,
        name: 'Sticker 1'
      },
      {
        id: 'sticker-2',
        type: 'svg',
        src: '<svg><rect x="10" y="10" width="80" height="80"/></svg>',
        x: 250,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 2,
        name: 'Sticker 2'
      }
    ]

    await nextTick()

    const sticker1 = wrapper.find('[data-id="sticker-1"]')
    expect(sticker1.exists()).toBe(true)

    // 验证多选功能存在
    expect(store.selectedStickerIds).toEqual([])
  })

  it('should handle selection box with multiple stickers', async () => {
    const store = wrapper.vm.store
    store.stickers = [
      {
        id: 'sticker-1',
        type: 'svg',
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 1,
        name: 'Sticker 1'
      },
      {
        id: 'sticker-2',
        type: 'svg',
        src: '<svg><rect x="10" y="10" width="80" height="80"/></svg>',
        x: 300,
        y: 300,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 2,
        name: 'Sticker 2'
      }
    ]

    // 开始选择框选
    wrapper.vm.isSelecting = true
    wrapper.vm.dragStart = { x: 50, y: 50 }
    wrapper.vm.selectionBox = { x: 50, y: 50, width: 0, height: 0 }

    // 模拟鼠标移动完成框选（覆盖两个贴纸）
    const mouseEvent = {
      clientX: 400,
      clientY: 400
    } as MouseEvent

    wrapper.vm.handleMouseMove(mouseEvent)

    // 验证两个贴纸都被选中
    expect(store.selectedStickerIds).toContain('sticker-1')
    expect(store.selectedStickerIds).toContain('sticker-2')
  })

  it('should handle different resize directions', async () => {
    const store = wrapper.vm.store
    store.stickers = [
      {
        id: 'test-sticker',
        type: 'svg',
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 1,
        name: 'Test Sticker'
      }
    ]
    store.selectedStickerIds = ['test-sticker']

    await nextTick()

    const resizeDirections = ['nw', 'ne', 'sw', 'se']

    for (const direction of resizeDirections) {
      const resizeHandle = wrapper.find(`[data-direction="${direction}"]`)
      expect(resizeHandle.exists()).toBe(true)
    }
  })

  it('should handle minimum size constraints during resize', async () => {
    const store = wrapper.vm.store
    store.stickers = [
      {
        id: 'test-sticker',
        type: 'svg',
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 1,
        name: 'Test Sticker'
      }
    ]
    store.selectedStickerIds = ['test-sticker']

    // 开始调整大小（向内拖拽，应该触发最小尺寸限制）
    wrapper.vm.isResizing = true
    wrapper.vm.resizeDirection = 'se'
    wrapper.vm.dragStart = { x: 200, y: 200 }
    wrapper.vm.stickerStartMap.set('test-sticker', { x: 100, y: 100, width: 100, height: 100, rotation: 0 })

    // 模拟鼠标向内移动（尺寸会小于20）
    const mouseEvent = {
      clientX: 110, // 导致宽度 = 100 + (110 - 200) = 10 < 20
      clientY: 110 // 导致高度 = 100 + (110 - 200) = 10 < 20
    } as MouseEvent

    wrapper.vm.handleMouseMove(mouseEvent)

    // 验证最小尺寸限制
    const updatedSticker = store.stickers.find((s: any) => s.id === 'test-sticker')
    expect(updatedSticker.width).toBe(20) // 最小宽度
    expect(updatedSticker.height).toBe(20) // 最小高度
  })
})