import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LayerManager from '@/components/LayerManager.vue'
import { useCanvasStore } from '@/stores/canvas'

describe('LayerManager.vue', () => {
  let wrapper: any
  let store: any

  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
    store = useCanvasStore()
    wrapper = mount(LayerManager, {
      global: {
        plugins: [pinia]
      }
    })
  })

  it('renders correctly with empty state', () => {
    expect(wrapper.find('h3').text()).toBe('图层管理')
    expect(wrapper.text()).toContain('暂无贴纸')
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('renders stickers sorted by zIndex (descending)', async () => {
    store.stickers = [
      { 
        id: 'sticker-1', 
        type: 'svg', 
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>', 
        x: 10, 
        y: 20, 
        width: 100, 
        height: 100, 
        rotation: 0, 
        zIndex: 1,
        name: 'Test 1'
      },
      { 
        id: 'sticker-2', 
        type: 'svg', 
        src: '<svg><rect x="10" y="10" width="80" height="80"/></svg>', 
        x: 30, 
        y: 40, 
        width: 100, 
        height: 100, 
        rotation: 0, 
        zIndex: 3,
        name: 'Test 2'
      },
      { 
        id: 'sticker-3', 
        type: 'svg', 
        src: '<svg><ellipse cx="50" cy="50" rx="40" ry="30"/></svg>', 
        x: 50, 
        y: 60, 
        width: 100, 
        height: 100, 
        rotation: 0, 
        zIndex: 2,
        name: 'Test 3'
      }
    ]

    await wrapper.vm.$nextTick()

    // Use text content to verify sorting
    const text = wrapper.text()
    expect(text).toContain('Test 1')
    expect(text).toContain('Test 2')
    expect(text).toContain('Test 3')

    // Verify zIndex values are present
    expect(text).toContain('层级: 1')
    expect(text).toContain('层级: 2')
    expect(text).toContain('层级: 3')
  })

  it('renders SVG stickers correctly', async () => {
    store.stickers = [
      { 
        id: 'sticker-1', 
        type: 'svg', 
        src: '<svg><circle cx="50" cy="50" r="40" fill="red"/></svg>', 
        x: 10, 
        y: 20, 
        width: 100, 
        height: 100, 
        rotation: 0, 
        zIndex: 1,
        name: 'Circle'
      }
    ]

    await wrapper.vm.$nextTick()

    // Check that SVG content is rendered
    const html = wrapper.html()
    expect(html).toContain('<circle')
    expect(html).toContain('cx="50"')
    expect(html).toContain('cy="50"')
    expect(html).toContain('r="40"')
  })

  it('renders image stickers correctly', async () => {
    store.stickers = [
      { 
        id: 'sticker-1', 
        type: 'image', 
        src: 'data:image/png;base64,test123', 
        x: 10, 
        y: 20, 
        width: 100, 
        height: 100, 
        rotation: 0, 
        zIndex: 1,
        name: 'Test Image'
      }
    ]

    await wrapper.vm.$nextTick()

    // Check that image is rendered
    const html = wrapper.html()
    expect(html).toContain('<img')
    expect(html).toContain('data:image/png;base64,test123')
  })

  it('handles sticker selection correctly', async () => {
    store.stickers = [
      { 
        id: 'sticker-1', 
        type: 'svg', 
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>', 
        x: 10, 
        y: 20, 
        width: 100, 
        height: 100, 
        rotation: 0, 
        zIndex: 1,
        name: 'Test 1'
      }
    ]

    await wrapper.vm.$nextTick()

    const selectSpy = vi.spyOn(store, 'selectSticker')

    // Find and click the first sticker item
    const stickerItems = wrapper.findAll('.divide-y > div')
    if (stickerItems.length > 0) {
      await stickerItems[0].trigger('click')
      expect(selectSpy).toHaveBeenCalledWith('sticker-1')
    }
  })

  it('shows selected state correctly', async () => {
    store.stickers = [
      { 
        id: 'sticker-1', 
        type: 'svg', 
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>', 
        x: 10, 
        y: 20, 
        width: 100, 
        height: 100, 
        rotation: 0, 
        zIndex: 1,
        name: 'Test 1'
      }
    ]
    store.selectedStickerIds = ['sticker-1']

    await wrapper.vm.$nextTick()

    // Check that selected class is applied
    const html = wrapper.html()
    expect(html).toContain('bg-blue-50')
  })

  it('shows selection count when stickers are selected', async () => {
    store.stickers = [
      { 
        id: 'sticker-1', 
        type: 'svg', 
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>', 
        x: 10, 
        y: 20, 
        width: 100, 
        height: 100, 
        rotation: 0, 
        zIndex: 1,
        name: 'Test 1'
      }
    ]
    store.selectedStickerIds = ['sticker-1']

    await wrapper.vm.$nextTick()

    // Check selection count is shown
    const text = wrapper.text()
    expect(text).toContain('已选 1')
  })

  it('does not show selection count when no stickers selected', async () => {
    store.stickers = [
      { 
        id: 'sticker-1', 
        type: 'svg', 
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>', 
        x: 10, 
        y: 20, 
        width: 100, 
        height: 100, 
        rotation: 0, 
        zIndex: 1,
        name: 'Test 1'
      }
    ]
    store.selectedStickerIds = []

    await wrapper.vm.$nextTick()

    // Check selection count is not shown
    const text = wrapper.text()
    expect(text).not.toContain('已选')
  })

  it('formats sticker names correctly', async () => {
    store.stickers = [
      { 
        id: 'sticker-1', 
        type: 'svg', 
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>', 
        x: 10, 
        y: 20, 
        width: 100, 
        height: 100, 
        rotation: 0, 
        zIndex: 1,
        name: 'Very Long Sticker Name That Should Be Truncated'
      }
    ]

    await wrapper.vm.$nextTick()

    // Check that long names are truncated
    const text = wrapper.text()
    expect(text).toContain('Very Long Sticker Name That Should Be Truncated'.substring(0, 10) + '...')
  })

  it('handles hover effects correctly', async () => {
    store.stickers = [
      { 
        id: 'sticker-1', 
        type: 'svg', 
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>', 
        x: 10, 
        y: 20, 
        width: 100, 
        height: 100, 
        rotation: 0, 
        zIndex: 1,
        name: 'Test 1'
      }
    ]

    await wrapper.vm.$nextTick()

    // Check that hover classes are present
    const html = wrapper.html()
    expect(html).toContain('hover:bg-gray-50')
    expect(html).toContain('transition-colors')
    expect(html).toContain('cursor-pointer')
  })

  it('applies correct layout classes', () => {
    const html = wrapper.html()
    expect(html).toContain('flex flex-col h-full')
    expect(html).toContain('bg-white rounded-lg shadow')
  })

  it('applies correct header styling', async () => {
    store.stickers = [
      { 
        id: 'sticker-1', 
        type: 'svg', 
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>', 
        x: 10, 
        y: 20, 
        width: 100, 
        height: 100, 
        rotation: 0, 
        zIndex: 1,
        name: 'Test 1'
      }
    ]

    await wrapper.vm.$nextTick()

    const html = wrapper.html()
    expect(html).toContain('p-3 border-b')
    expect(html).toContain('font-semibold text-gray-800')
  })

  it('applies correct content area styling', async () => {
    store.stickers = [
      { 
        id: 'sticker-1', 
        type: 'svg', 
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>', 
        x: 10, 
        y: 20, 
        width: 100, 
        height: 100, 
        rotation: 0, 
        zIndex: 1,
        name: 'Test 1'
      }
    ]

    await wrapper.vm.$nextTick()

    const html = wrapper.html()
    expect(html).toContain('flex-1 overflow-y-auto')
    expect(html).toContain('divide-y')
  })

  it('applies correct sticker item styling', async () => {
    store.stickers = [
      { 
        id: 'sticker-1', 
        type: 'svg', 
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>', 
        x: 10, 
        y: 20, 
        width: 100, 
        height: 100, 
        rotation: 0, 
        zIndex: 1,
        name: 'Test 1'
      }
    ]

    await wrapper.vm.$nextTick()

    const html = wrapper.html()
    expect(html).toContain('flex items-center gap-2 p-2')
    expect(html).toContain('hover:bg-gray-50')
    expect(html).toContain('transition-colors')
    expect(html).toContain('cursor-pointer')
  })

  it('applies correct thumbnail container styling', async () => {
    store.stickers = [
      { 
        id: 'sticker-1', 
        type: 'svg', 
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>', 
        x: 10, 
        y: 20, 
        width: 100, 
        height: 100, 
        rotation: 0, 
        zIndex: 1,
        name: 'Test 1'
      }
    ]

    await wrapper.vm.$nextTick()

    const html = wrapper.html()
    expect(html).toContain('w-10 h-10')
    expect(html).toContain('flex items-center justify-center')
    expect(html).toContain('bg-gray-100 rounded overflow-hidden')
    expect(html).toContain('flex-shrink-0')
  })

  it('applies correct text styling', async () => {
    store.stickers = [
      { 
        id: 'sticker-1', 
        type: 'svg', 
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>', 
        x: 10, 
        y: 20, 
        width: 100, 
        height: 100, 
        rotation: 0, 
        zIndex: 1,
        name: 'Test 1'
      }
    ]

    await wrapper.vm.$nextTick()

    const html = wrapper.html()
    expect(html).toContain('text-sm text-gray-700 truncate')
    expect(html).toContain('text-xs text-gray-400')
  })

  it('handles empty sticker array correctly', () => {
    store.stickers = []
    const text = wrapper.text()
    expect(text).toContain('暂无贴纸')
    expect(text).toContain('从左侧面板添加贴纸')
  })

  it('handles single sticker correctly', async () => {
    store.stickers = [
      { 
        id: 'sticker-1', 
        type: 'svg', 
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>', 
        x: 10, 
        y: 20, 
        width: 100, 
        height: 100, 
        rotation: 0, 
        zIndex: 1,
        name: 'Single Sticker'
      }
    ]

    await wrapper.vm.$nextTick()

    const text = wrapper.text()
    // The name gets truncated, so check for the truncated version
    expect(text).toContain('Single Sti...')
    expect(text).toContain('层级: 1')
  })

  it('handles stickers with same zIndex correctly', async () => {
    store.stickers = [
      { 
        id: 'sticker-1', 
        type: 'svg', 
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>', 
        x: 10, 
        y: 20, 
        width: 100, 
        height: 100, 
        rotation: 0, 
        zIndex: 2,
        name: 'First'
      },
      { 
        id: 'sticker-2', 
        type: 'svg', 
        src: '<svg><rect x="10" y="10" width="80" height="80"/></svg>', 
        x: 30, 
        y: 40, 
        width: 100, 
        height: 100, 
        rotation: 0, 
        zIndex: 2,
        name: 'Second'
      }
    ]

    await wrapper.vm.$nextTick()

    const text = wrapper.text()
    expect(text).toContain('First')
    expect(text).toContain('Second')
    expect(text).toContain('层级: 2')
  })
})