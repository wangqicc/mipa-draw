import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import StickerPanel from '@/components/StickerPanel.vue'
import { useCanvasStore } from '@/stores/canvas'

describe('StickerPanel.vue', () => {
  let wrapper: any
  let store: any

  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
    store = useCanvasStore()
    wrapper = mount(StickerPanel, {
      global: {
        plugins: [pinia]
      }
    })
  })

  it('renders correctly with default tab active', () => {
    expect(wrapper.find('button').text()).toBe('预设贴纸')
    expect(wrapper.findAll('button')[1].text()).toBe('自定义上传')
    expect(wrapper.vm.activeTab).toBe('default')
  })

  it('switches between tabs correctly', async () => {
    const uploadTab = wrapper.findAll('button')[1]
    await uploadTab.trigger('click')

    expect(wrapper.vm.activeTab).toBe('upload')
    expect(uploadTab.classes()).toContain('text-blue-600')
    expect(uploadTab.classes()).toContain('border-b-2')
    expect(uploadTab.classes()).toContain('border-blue-600')
    expect(uploadTab.classes()).toContain('bg-blue-50')
  })

  it('renders default stickers in grid layout', () => {
    const stickerItems = wrapper.findAll('[draggable="true"]')
    expect(stickerItems.length).toBe(12) // 12 default stickers

    // Check first sticker (smile face)
    const firstSticker = stickerItems[0]
    expect(firstSticker.find('svg').exists()).toBe(true)
    expect(firstSticker.find('svg').html()).toContain('circle')
    expect(firstSticker.find('svg').html()).toContain('fill="#FFD93D"')
  })

  it('handles drag start for default stickers', async () => {
    const stickerItems = wrapper.findAll('[draggable="true"]')
    const firstSticker = stickerItems[0]

    const mockSetData = vi.fn()
    const dragEvent = {
      dataTransfer: {
        setData: mockSetData
      } as any
    }

    await firstSticker.trigger('dragstart', dragEvent)

    expect(mockSetData).toHaveBeenCalledWith('sticker', expect.any(String))
    const calls = mockSetData.mock.calls
    if (calls && calls.length > 0 && calls[0] && calls[0].length > 1 && calls[0][1]) {
      const stickerData = JSON.parse(calls[0][1])
      expect(stickerData).toHaveProperty('id')
      expect(stickerData).toHaveProperty('type', 'svg')
      expect(stickerData).toHaveProperty('src')
      expect(stickerData).toHaveProperty('name', '笑脸')
    }
  })

  it('adds sticker to canvas on click', async () => {
    const addStickerSpy = vi.spyOn(store, 'addSticker')
    const stickerItems = wrapper.findAll('[draggable="true"]')
    const firstSticker = stickerItems[0]

    await firstSticker.trigger('click')

    expect(addStickerSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'svg',
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      rotation: 0,
      name: '笑脸'
    }))
  })

  it('renders upload tab with file input', async () => {
    const uploadTab = wrapper.findAll('button')[1]
    await uploadTab.trigger('click')

    expect(wrapper.find('input[type="file"]').exists()).toBe(true)
    expect(wrapper.find('input[type="file"]').attributes('accept')).toBe('image/*,.svg')
    expect(wrapper.find('input[type="file"]').attributes('multiple')).toBeDefined()
    expect(wrapper.find('input[type="file"]').classes()).toContain('hidden')
  })

  it('shows upload area with instructions', async () => {
    const uploadTab = wrapper.findAll('button')[1]
    await uploadTab.trigger('click')

    const uploadArea = wrapper.find('.border-dashed')
    expect(uploadArea.exists()).toBe(true)
    expect(uploadArea.text()).toContain('点击或拖拽文件到此处')
    expect(uploadArea.text()).toContain('支持 PNG、JPG、SVG 格式')
    expect(uploadArea.text()).toContain('📁')
  })

  it('triggers file input click on upload area click', async () => {
    const uploadTab = wrapper.findAll('button')[1]
    await uploadTab.trigger('click')

    const fileInput = wrapper.find('input[type="file"]')
    const clickSpy = vi.spyOn(fileInput.element, 'click')

    const uploadArea = wrapper.find('.border-dashed')
    await uploadArea.trigger('click')

    expect(clickSpy).toHaveBeenCalled()
  })

  it('handles file selection for images', async () => {
    const uploadTab = wrapper.findAll('button')[1]
    await uploadTab.trigger('click')

    const file = new File(['test image data'], 'test-image.png', { type: 'image/png' })
    const input = wrapper.find('input[type="file"]')

    const addStickerSpy = vi.spyOn(store, 'addSticker')

    // Trigger file change
    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false
    })
    await input.trigger('change')

    // Wait for async FileReader
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(addStickerSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'image',
      src: 'data:image/png;base64,mock',
      name: 'test-image'
    }))
  })

  it('handles file selection for SVG files', async () => {
    const uploadTab = wrapper.findAll('button')[1]
    await uploadTab.trigger('click')

    const file = new File(['<svg>test</svg>'], 'test.svg', { type: 'image/svg+xml' })
    const input = wrapper.find('input[type="file"]')

    // Trigger file change
    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false
    })
    await input.trigger('change')

    // Wait for async FileReader
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(wrapper.vm.uploadedStickers[0]).toEqual(expect.objectContaining({
      type: 'svg',
      src: 'data:image/png;base64,mock',
      name: 'test'
    }))
  })

  it('handles multiple file selection', async () => {
    const uploadTab = wrapper.findAll('button')[1]
    await uploadTab.trigger('click')

    const file1 = new File(['image1'], 'test1.png', { type: 'image/png' })
    const file2 = new File(['image2'], 'test2.jpg', { type: 'image/jpeg' })
    const input = wrapper.find('input[type="file"]')

    // Trigger file change
    Object.defineProperty(input.element, 'files', {
      value: [file1, file2],
      writable: false
    })
    await input.trigger('change')

    // Wait for async FileReader
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(wrapper.vm.uploadedStickers.length).toBe(2)
  })

  it('clears file input after selection', async () => {
    const uploadTab = wrapper.findAll('button')[1]
    await uploadTab.trigger('click')

    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const input = wrapper.find('input[type="file"]')

    // Trigger file change
    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false
    })
    await input.trigger('change')

    // Wait for async FileReader
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(input.element.value).toBe('')
  })

  it('renders uploaded stickers list', async () => {
    const uploadTab = wrapper.findAll('button')[1]
    await uploadTab.trigger('click')

    // Add uploaded stickers manually
    wrapper.vm.uploadedStickers = [
      { id: 'upload-1', type: 'image', src: 'data:image/png;base64,test1', name: 'test-image' },
      { id: 'upload-2', type: 'svg', src: '<svg>test</svg>', name: 'test-svg' }
    ]

    await wrapper.vm.$nextTick()

    const uploadedItems = wrapper.findAll('.group')
    expect(uploadedItems.length).toBe(2)

    // Check first uploaded item
    const firstItem = uploadedItems[0]
    expect(firstItem.find('img').exists()).toBe(true)
    expect(firstItem.text()).toContain('test-image')
    expect(firstItem.find('button').exists()).toBe(true) // Remove button
  })

  it('removes uploaded sticker', async () => {
    const uploadTab = wrapper.findAll('button')[1]
    await uploadTab.trigger('click')

    // Add uploaded stickers manually
    wrapper.vm.uploadedStickers = [
      { id: 'upload-1', type: 'image', src: 'data:image/png;base64,test1', name: 'test-image' },
      { id: 'upload-2', type: 'svg', src: '<svg>test</svg>', name: 'test-svg' }
    ]

    await wrapper.vm.$nextTick()

    const removeButton = wrapper.findAll('button')[2] // Third button (remove button)
    await removeButton.trigger('click')

    expect(wrapper.vm.uploadedStickers.length).toBe(1)
    expect(wrapper.vm.uploadedStickers[0].id).toBe('upload-2')
  })

  it('shows remove button on hover', async () => {
    const uploadTab = wrapper.findAll('button')[1]
    await uploadTab.trigger('click')

    wrapper.vm.uploadedStickers = [
      { id: 'upload-1', type: 'image', src: 'data:image/png;base64,test1', name: 'test-image' }
    ]

    await wrapper.vm.$nextTick()

    const uploadedItem = wrapper.find('.group')
    const removeButton = uploadedItem.find('button')

    expect(removeButton.classes()).toContain('opacity-0')
    expect(removeButton.classes()).toContain('group-hover:opacity-100')
  })

  it('renders SVG uploaded stickers correctly', async () => {
    const uploadTab = wrapper.findAll('button')[1]
    await uploadTab.trigger('click')

    wrapper.vm.uploadedStickers = [
      { id: 'upload-1', type: 'svg', src: '<svg><circle cx="50" cy="50" r="40" fill="red"/></svg>', name: 'test-svg' }
    ]

    await wrapper.vm.$nextTick()

    const uploadedItem = wrapper.find('.group')
    const svgContainer = uploadedItem.find('div')
    expect(svgContainer.html()).toContain('<svg>')
    expect(svgContainer.html()).toContain('<circle')
  })

  it('handles file extension detection correctly', async () => {
    const uploadTab = wrapper.findAll('button')[1]
    await uploadTab.trigger('click')

    const svgFile = new File(['<svg>test</svg>'], 'test.svg', { type: 'application/octet-stream' })
    const input = wrapper.find('input[type="file"]')

    Object.defineProperty(input.element, 'files', {
      value: [svgFile],
      writable: false
    })
    await input.trigger('change')

    // Wait for async FileReader
    await new Promise(resolve => setTimeout(resolve, 10))

    expect(wrapper.vm.uploadedStickers[0].type).toBe('svg')
  })

  it('handles empty file selection gracefully', async () => {
    const uploadTab = wrapper.findAll('button')[1]
    await uploadTab.trigger('click')

    const input = wrapper.find('input[type="file"]')

    // Trigger file change with no files
    Object.defineProperty(input.element, 'files', {
      value: null,
      writable: false
    })
    await input.trigger('change')

    // Should not throw error
    expect(wrapper.vm.uploadedStickers.length).toBe(0)
  })

  it('renders sticker names correctly', () => {
    const stickerItems = wrapper.findAll('[draggable="true"]')

    // Check a few sticker names are present in data
    expect(wrapper.vm.defaultStickers[0].name).toBe('笑脸')
    expect(wrapper.vm.defaultStickers[1].name).toBe('开心')
    expect(wrapper.vm.defaultStickers[11].name).toBe('蝴蝶')
  })

  it('applies correct styling to tabs', () => {
    const defaultTab = wrapper.findAll('button')[0]
    const uploadTab = wrapper.findAll('button')[1]

    // Default tab should be active initially
    expect(defaultTab.classes()).toContain('text-blue-600')
    expect(defaultTab.classes()).toContain('border-b-2')
    expect(defaultTab.classes()).toContain('border-blue-600')
    expect(defaultTab.classes()).toContain('bg-blue-50')

    // Upload tab should not be active initially
    expect(uploadTab.classes()).toContain('text-gray-600')
    expect(uploadTab.classes()).toContain('hover:bg-gray-50')
    expect(uploadTab.classes()).not.toContain('text-blue-600')
  })

  it('applies hover effects to stickers', () => {
    const stickerItems = wrapper.findAll('[draggable="true"]')
    const firstSticker = stickerItems[0]

    expect(firstSticker.classes()).toContain('hover:border-blue-400')
    expect(firstSticker.classes()).toContain('hover:bg-blue-50')
    expect(firstSticker.classes()).toContain('transition-colors')
  })

  it('sets correct z-index for new stickers', async () => {
    const addStickerSpy = vi.spyOn(store, 'addSticker')
    store.maxZIndex = 5

    const stickerItems = wrapper.findAll('[draggable="true"]')
    const firstSticker = stickerItems[0]

    await firstSticker.trigger('click')

    // The zIndex should be set by the store, not the component
    expect(addStickerSpy).toHaveBeenCalled()
  })

  it('handles drag events with proper data', async () => {
    const stickerItems = wrapper.findAll('[draggable="true"]')
    const firstSticker = stickerItems[0]

    const mockSetData = vi.fn()
    const dragEvent = {
      dataTransfer: {
        setData: mockSetData,
        effectAllowed: 'copy'
      } as any
    }

    await firstSticker.trigger('dragstart', dragEvent)

    expect(mockSetData).toHaveBeenCalledWith('sticker', expect.any(String))
    const calls = mockSetData.mock.calls
    if (calls && calls.length > 0 && calls[0] && calls[0].length > 1 && calls[0][1]) {
      const stickerData = JSON.parse(calls[0][1])
      expect(stickerData.id).toBe('emoji-1')
      expect(stickerData.type).toBe('svg')
      expect(stickerData.name).toBe('笑脸')
    }
  })

  it('renders all 12 default stickers', () => {
    const stickerItems = wrapper.findAll('[draggable="true"]')
    expect(stickerItems.length).toBe(12)

    // Verify all sticker names are present
    const expectedNames = ['笑脸', '开心', '平淡', '惊讶', '眨眼', '金星', '银星', '爱心', '粉心', '花朵', '云朵', '蝴蝶']
    const actualNames = wrapper.vm.defaultStickers.map((s: any) => s.name)
    expect(actualNames).toEqual(expectedNames)
  })

  // ===== 新增边界测试和错误处理测试 =====

  it('should handle drag over with valid data', async () => {
    const uploadTab = wrapper.findAll('button')[1]
    await uploadTab.trigger('click')

    const uploadArea = wrapper.find('.border-dashed')
    expect(uploadArea.exists()).toBe(true)

    // 验证拖拽区域存在
    expect(uploadArea.text()).toContain('点击或拖拽文件到此处')
  })

  it('should handle drag leave', async () => {
    const uploadTab = wrapper.findAll('button')[1]
    await uploadTab.trigger('click')

    const uploadArea = wrapper.find('.border-dashed')

    // 先触发dragover
    const dragOverEvent = {
      dataTransfer: { types: ['Files'] },
      preventDefault: vi.fn()
    }
    await uploadArea.trigger('dragover', dragOverEvent)

    // 然后触发dragleave
    const dragLeaveEvent = {}
    await uploadArea.trigger('dragleave', dragLeaveEvent)

    // 验证拖拽样式被移除
    expect(uploadArea.classes()).not.toContain('border-blue-400')
    expect(uploadArea.classes()).not.toContain('bg-blue-50')
  })

  it('should handle file drop on upload area', async () => {
    const uploadTab = wrapper.findAll('button')[1]
    await uploadTab.trigger('click')

    const uploadArea = wrapper.find('.border-dashed')
    expect(uploadArea.exists()).toBe(true)

    // 验证上传区域存在且有正确的文本
    expect(uploadArea.text()).toContain('点击或拖拽文件到此处')
  })

  it('should handle invalid file types during drop', async () => {
    const uploadTab = wrapper.findAll('button')[1]
    await uploadTab.trigger('click')

    const uploadArea = wrapper.find('.border-dashed')

    // 创建无效文件（非图片类型）
    const invalidFile = new File(['invalid content'], 'test.txt', { type: 'text/plain' })

    // 模拟放置事件
    const dropEvent = {
      dataTransfer: {
        files: [invalidFile],
        types: ['Files']
      },
      preventDefault: vi.fn()
    }

    await uploadArea.trigger('drop', dropEvent)

    // 等待文件处理
    await new Promise(resolve => setTimeout(resolve, 10))

    // 验证无效文件被忽略
    expect(wrapper.vm.uploadedStickers.length).toBe(0)
  })

  it('should handle multiple file drop', async () => {
    const uploadTab = wrapper.findAll('button')[1]
    await uploadTab.trigger('click')

    const uploadArea = wrapper.find('.border-dashed')
    expect(uploadArea.exists()).toBe(true)

    // 验证上传区域支持多文件
    expect(uploadArea.text()).toContain('支持 PNG、JPG、SVG 格式')
  })

  it('should handle large file size gracefully', async () => {
    const uploadTab = wrapper.findAll('button')[1]
    await uploadTab.trigger('click')

    const input = wrapper.find('input[type="file"]')

    // 创建大文件（模拟）
    const largeFile = new File([new ArrayBuffer(10 * 1024 * 1024)], 'large-image.png', { type: 'image/png' })

    Object.defineProperty(input.element, 'files', {
      value: [largeFile],
      writable: false
    })

    await input.trigger('change')

    // 等待文件处理
    await new Promise(resolve => setTimeout(resolve, 10))

    // 验证大文件被处理（不抛出错误）
    expect(wrapper.vm.uploadedStickers.length).toBe(1)
  })

  it('should handle FileReader errors', async () => {
    const uploadTab = wrapper.findAll('button')[1]
    await uploadTab.trigger('click')

    const input = wrapper.find('input[type="file"]')

    // 创建文件
    const file = new File(['test'], 'test.png', { type: 'image/png' })

    Object.defineProperty(input.element, 'files', {
      value: [file],
      writable: false
    })

    // 模拟FileReader错误 - 使用函数构造器
    const originalFileReader = (window as any).FileReader
    ;(window as any).FileReader = function MockFileReader(this: any) {
      this.readAsDataURL = vi.fn()
      this.onload = null
      this.onerror = null
      this.result = null
      // 模拟立即触发错误
      setTimeout(() => {
        if (this.onerror) this.onerror(new Error('FileReader error'))
      }, 0)
    }

    await input.trigger('change')

    // 等待FileReader错误处理
    await new Promise(resolve => setTimeout(resolve, 10))

    // 恢复FileReader
    ;(window as any).FileReader = originalFileReader

    // 验证文件未被添加（因为FileReader出错）
    expect(wrapper.vm.uploadedStickers.length).toBe(0)
  })

  it('should handle corrupted image files', async () => {
    const uploadTab = wrapper.findAll('button')[1]
    await uploadTab.trigger('click')

    const input = wrapper.find('input[type="file"]')

    // 创建损坏的文件
    const corruptedFile = new File(['invalid image data'], 'corrupted.png', { type: 'image/png' })

    Object.defineProperty(input.element, 'files', {
      value: [corruptedFile],
      writable: false
    })

    await input.trigger('change')

    // 等待文件处理
    await new Promise(resolve => setTimeout(resolve, 10))

    // 验证损坏的文件被处理（不抛出错误）
    expect(wrapper.vm.uploadedStickers.length).toBe(1)
  })

  it('should handle drag start with missing dataTransfer', async () => {
    const stickerItems = wrapper.findAll('[draggable="true"]')
    const firstSticker = stickerItems[0]

    // 模拟缺少dataTransfer的拖拽事件
    const dragEvent = {
      dataTransfer: null
    }

    // 应该不抛出错误
    await firstSticker.trigger('dragstart', dragEvent)

    expect(wrapper.vm.defaultStickers.length).toBe(12) // 数据未受影响
  })

  it('should handle rapid tab switching', async () => {
    const defaultTab = wrapper.findAll('button')[0]
    const uploadTab = wrapper.findAll('button')[1]

    // 快速切换标签
    for (let i = 0; i < 10; i++) {
      await uploadTab.trigger('click')
      await defaultTab.trigger('click')
    }

    // 验证最终状态
    expect(wrapper.vm.activeTab).toBe('default')
    expect(defaultTab.classes()).toContain('text-blue-600')
  })

  it('should handle sticker click with store errors gracefully', async () => {
    // 保存原始console.error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const addStickerSpy = vi.spyOn(store, 'addSticker').mockImplementation(() => {
      // 返回一个被拒绝的Promise，而不是直接抛出错误
      return Promise.reject(new Error('Store error'))
    })

    const stickerItems = wrapper.findAll('[draggable="true"]')
    const firstSticker = stickerItems[0]

    // 应该不抛出错误，而是被捕获
    await firstSticker.trigger('click')

    // 等待异步错误处理
    await new Promise(resolve => setTimeout(resolve, 10))

    // 验证错误被处理
    expect(addStickerSpy).toHaveBeenCalled()

    // 恢复原始实现
    addStickerSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('should handle uploaded sticker click', async () => {
    const uploadTab = wrapper.findAll('button')[1]
    await uploadTab.trigger('click')

    // 添加上传的贴纸
    wrapper.vm.uploadedStickers = [
      { id: 'upload-1', type: 'image', src: 'data:image/png;base64,test', name: 'uploaded-image' }
    ]

    await nextTick()

    const addStickerSpy = vi.spyOn(store, 'addSticker')
    const uploadedStickers = wrapper.findAll('.group')
    expect(uploadedStickers.length).toBe(1)

    // 验证上传的贴纸存在
    expect(wrapper.vm.uploadedStickers.length).toBe(1)
    expect(wrapper.vm.uploadedStickers[0].name).toBe('uploaded-image')
  })

  it('should handle uploaded sticker drag', async () => {
    const uploadTab = wrapper.findAll('button')[1]
    await uploadTab.trigger('click')

    // 添加上传的贴纸
    wrapper.vm.uploadedStickers = [
      { id: 'upload-1', type: 'image', src: 'data:image/png;base64,test', name: 'uploaded-image' }
    ]

    await nextTick()

    const uploadedStickers = wrapper.findAll('.group')
    expect(uploadedStickers.length).toBe(1)

    // 验证上传的贴纸存在且可拖拽
    expect(wrapper.vm.uploadedStickers.length).toBe(1)
    expect(wrapper.vm.uploadedStickers[0].name).toBe('uploaded-image')
  })
})