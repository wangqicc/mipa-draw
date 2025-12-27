import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PropertiesPanel from '@/components/PropertiesPanel.vue'
import { useCanvasStore } from '@/stores/canvas'

describe('PropertiesPanel.vue', () => {
  let wrapper: any
  let store: any

  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
    store = useCanvasStore()
    wrapper = mount(PropertiesPanel, {
      global: {
        plugins: [pinia]
      }
    })
  })

  it('renders correctly with empty state', () => {
    expect(wrapper.find('h3').text()).toBe('属性面板')
    expect(wrapper.find('.text-sm').text()).toBe('选择贴纸以编辑属性')
    expect(wrapper.find('.text-xs').text()).toBe('可使用框选多选贴纸')
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('shows multi-select information when multiple stickers selected', async () => {
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
        name: 'Test 1'
      },
      {
        id: 'test-2',
        type: 'image',
        src: 'data:image/png;base64,test2',
        x: 200,
        y: 200,
        width: 150,
        height: 150,
        rotation: 45,
        zIndex: 2,
        name: 'Test 2'
      }
    ]
    store.selectedStickerIds = ['test-1', 'test-2']

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('已选择 2 个贴纸')
    expect(wrapper.find('.bg-blue-50').exists()).toBe(true)
  })

  it('shows single sticker properties when one sticker selected', async () => {
    store.stickers = [
      {
        id: 'test-1',
        type: 'svg',
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>',
        x: 100,
        y: 200,
        width: 120,
        height: 80,
        rotation: 30,
        zIndex: 3,
        name: 'Test Sticker'
      }
    ]
    store.selectedStickerIds = ['test-1']

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('基本信息')
    expect(wrapper.text()).toContain('名称: Test Sticker')
    expect(wrapper.text()).toContain('类型: SVG')
    expect(wrapper.text()).toContain('层级: 3')

    // Check position inputs
    const xInput = wrapper.findAll('input[type="number"]')[0]
    const yInput = wrapper.findAll('input[type="number"]')[1]
    expect(xInput.attributes('value')).toBe('100')
    expect(yInput.attributes('value')).toBe('200')

    // Check size inputs
    const widthInput = wrapper.findAll('input[type="number"]')[2]
    const heightInput = wrapper.findAll('input[type="number"]')[3]
    expect(widthInput.attributes('value')).toBe('120')
    expect(heightInput.attributes('value')).toBe('80')

    // Check rotation
    expect(wrapper.text()).toContain('30°')
  })

  it('shows image type correctly', async () => {
    store.stickers = [
      {
        id: 'test-image',
        type: 'image',
        src: 'data:image/png;base64,test123',
        x: 150,
        y: 150,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 1,
        name: 'Test Image'
      }
    ]
    store.selectedStickerIds = ['test-image']

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('类型: 图片')
  })

  it('handles position updates correctly', async () => {
    store.stickers = [
      {
        id: 'test-1',
        type: 'svg',
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>',
        x: 100,
        y: 200,
        width: 120,
        height: 80,
        rotation: 30,
        zIndex: 3,
        name: 'Test Sticker'
      }
    ]
    store.selectedStickerIds = ['test-1']

    await wrapper.vm.$nextTick()

    const updateXSpy = vi.spyOn(store, 'updateSticker')

    const xInput = wrapper.find('input[type="number"]')
    if (xInput.exists()) {
      await xInput.setValue('250')
      await xInput.trigger('change')
      expect(updateXSpy).toHaveBeenCalledWith('test-1', { x: 250 })
    }
  })

  it('handles size updates correctly', async () => {
    store.stickers = [
      {
        id: 'test-1',
        type: 'svg',
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>',
        x: 100,
        y: 200,
        width: 120,
        height: 80,
        rotation: 30,
        zIndex: 3,
        name: 'Test Sticker'
      }
    ]
    store.selectedStickerIds = ['test-1']

    await wrapper.vm.$nextTick()

    const updateWidthSpy = vi.spyOn(store, 'updateSticker')

    const widthInput = wrapper.findAll('input[type="number"]')[2]
    if (widthInput.exists()) {
      await widthInput.setValue('200')
      await widthInput.trigger('change')
      expect(updateWidthSpy).toHaveBeenCalledWith('test-1', { width: 200 })
    }
  })

  it('handles rotation updates correctly', async () => {
    store.stickers = [
      {
        id: 'test-1',
        type: 'svg',
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>',
        x: 100,
        y: 200,
        width: 120,
        height: 80,
        rotation: 30,
        zIndex: 3,
        name: 'Test Sticker'
      }
    ]
    store.selectedStickerIds = ['test-1']

    await wrapper.vm.$nextTick()

    const updateRotationSpy = vi.spyOn(store, 'updateSticker')

    const rotationInput = wrapper.find('input[type="range"]')
    if (rotationInput.exists()) {
      await rotationInput.setValue('90')
      await rotationInput.trigger('input')
      expect(updateRotationSpy).toHaveBeenCalledWith('test-1', { rotation: 90 })
    }
  })

  it('handles layer operations for single sticker', async () => {
    store.stickers = [
      {
        id: 'test-1',
        type: 'svg',
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>',
        x: 100,
        y: 200,
        width: 120,
        height: 80,
        rotation: 30,
        zIndex: 3,
        name: 'Test Sticker'
      }
    ]
    store.selectedStickerIds = ['test-1']

    await wrapper.vm.$nextTick()

    const bringToFrontSpy = vi.spyOn(store, 'bringToFront')
    const sendToBackSpy = vi.spyOn(store, 'sendToBack')
    const moveUpSpy = vi.spyOn(store, 'moveUp')
    const moveDownSpy = vi.spyOn(store, 'moveDown')

    const layerButtons = wrapper.findAll('.grid button')
    if (layerButtons.length >= 4) {
      // Test move up
      await layerButtons[0].trigger('click')
      expect(moveUpSpy).toHaveBeenCalledWith('test-1')

      // Test move down
      await layerButtons[1].trigger('click')
      expect(moveDownSpy).toHaveBeenCalledWith('test-1')

      // Test bring to front
      await layerButtons[2].trigger('click')
      expect(bringToFrontSpy).toHaveBeenCalledWith('test-1')

      // Test send to back
      await layerButtons[3].trigger('click')
      expect(sendToBackSpy).toHaveBeenCalledWith('test-1')
    }
  })

  it('handles layer operations for multiple stickers', async () => {
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
        name: 'Test 1'
      },
      {
        id: 'test-2',
        type: 'image',
        src: 'data:image/png;base64,test2',
        x: 200,
        y: 200,
        width: 150,
        height: 150,
        rotation: 45,
        zIndex: 2,
        name: 'Test 2'
      }
    ]
    store.selectedStickerIds = ['test-1', 'test-2']

    await wrapper.vm.$nextTick()

    const bringSelectedToFrontSpy = vi.spyOn(store, 'bringSelectedToFront')
    const sendSelectedToBackSpy = vi.spyOn(store, 'sendSelectedToBack')
    const moveSelectedUpSpy = vi.spyOn(store, 'moveSelectedUp')
    const moveSelectedDownSpy = vi.spyOn(store, 'moveSelectedDown')

    const layerButtons = wrapper.findAll('.grid button')
    expect(layerButtons.length).toBe(4)

    // Test move selected up
    await layerButtons[0].trigger('click')
    expect(moveSelectedUpSpy).toHaveBeenCalled()

    // Test move selected down
    await layerButtons[1].trigger('click')
    expect(moveSelectedDownSpy).toHaveBeenCalled()

    // Test bring selected to front
    await layerButtons[2].trigger('click')
    expect(bringSelectedToFrontSpy).toHaveBeenCalled()

    // Test send selected to back
    await layerButtons[3].trigger('click')
    expect(sendSelectedToBackSpy).toHaveBeenCalled()
  })

  it('handles delete operations correctly', async () => {
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
        name: 'Test 1'
      }
    ]
    store.selectedStickerIds = ['test-1']

    await wrapper.vm.$nextTick()

    const removeStickerSpy = vi.spyOn(store, 'removeSticker')

    const deleteButton = wrapper.findAll('button').find((btn: any) => 
      btn.text().includes('删除')
    )
    if (deleteButton) {
      await deleteButton.trigger('click')
      expect(removeStickerSpy).toHaveBeenCalledWith('test-1')
    }
  })

  it('handles duplicate operations correctly', async () => {
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
        name: 'Test 1'
      }
    ]
    store.selectedStickerIds = ['test-1']

    await wrapper.vm.$nextTick()

    const duplicateStickerSpy = vi.spyOn(store, 'duplicateSticker')

    const duplicateButton = wrapper.findAll('button').find((btn: any) => 
      btn.text().includes('复制')
    )
    if (duplicateButton) {
      await duplicateButton.trigger('click')
      expect(duplicateStickerSpy).toHaveBeenCalledWith('test-1')
    }
  })

  it('handles batch delete for multiple stickers', async () => {
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
        name: 'Test 1'
      },
      {
        id: 'test-2',
        type: 'image',
        src: 'data:image/png;base64,test2',
        x: 200,
        y: 200,
        width: 150,
        height: 150,
        rotation: 45,
        zIndex: 2,
        name: 'Test 2'
      }
    ]
    store.selectedStickerIds = ['test-1', 'test-2']

    await wrapper.vm.$nextTick()

    const removeSelectedStickersSpy = vi.spyOn(store, 'removeSelectedStickers')

    const deleteButton = wrapper.findAll('.flex button').find((btn: any) => 
      btn.text().includes('批量删除')
    )
    await deleteButton.trigger('click')

    expect(removeSelectedStickersSpy).toHaveBeenCalled()
  })

  it('handles batch duplicate for multiple stickers', async () => {
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
        name: 'Test 1'
      },
      {
        id: 'test-2',
        type: 'image',
        src: 'data:image/png;base64,test2',
        x: 200,
        y: 200,
        width: 150,
        height: 150,
        rotation: 45,
        zIndex: 2,
        name: 'Test 2'
      }
    ]
    store.selectedStickerIds = ['test-1', 'test-2']

    await wrapper.vm.$nextTick()

    const duplicateSelectedStickersSpy = vi.spyOn(store, 'duplicateSelectedStickers')

    const duplicateButton = wrapper.findAll('.flex button').find((btn: any) => 
      btn.text().includes('批量复制')
    )
    await duplicateButton.trigger('click')

    expect(duplicateSelectedStickersSpy).toHaveBeenCalled()
  })

  it('applies correct styling to panel', () => {
    expect(wrapper.classes()).toContain('flex')
    expect(wrapper.classes()).toContain('flex-col')
    expect(wrapper.classes()).toContain('h-full')
    expect(wrapper.classes()).toContain('bg-white')
    expect(wrapper.classes()).toContain('rounded-lg')
    expect(wrapper.classes()).toContain('shadow')
  })

  it('applies correct styling to header', () => {
    const header = wrapper.find('.border-b')
    expect(header.classes()).toContain('p-3')

    const title = header.find('h3')
    expect(title.classes()).toContain('font-semibold')
    expect(title.classes()).toContain('text-gray-800')
  })

  it('applies correct styling to content area', () => {
    const content = wrapper.find('.flex-1')
    expect(content.classes()).toContain('overflow-y-auto')
    expect(content.classes()).toContain('p-3')
  })

  it('applies correct styling to input fields', async () => {
    store.stickers = [
      {
        id: 'test-1',
        type: 'svg',
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>',
        x: 100,
        y: 200,
        width: 120,
        height: 80,
        rotation: 30,
        zIndex: 3,
        name: 'Test Sticker'
      }
    ]
    store.selectedStickerIds = ['test-1']

    await wrapper.vm.$nextTick()

    const inputs = wrapper.findAll('input[type="number"]')
    inputs.forEach((input: any) => {
      expect(input.classes()).toContain('w-full')
      expect(input.classes()).toContain('px-2')
      expect(input.classes()).toContain('py-1')
      expect(input.classes()).toContain('text-sm')
      expect(input.classes()).toContain('border')
      expect(input.classes()).toContain('rounded')
      expect(input.classes()).toContain('focus:outline-none')
      expect(input.classes()).toContain('focus:ring-1')
      expect(input.classes()).toContain('focus:ring-blue-500')
    })
  })

  it('applies correct styling to buttons', async () => {
    store.stickers = [
      {
        id: 'test-1',
        type: 'svg',
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>',
        x: 100,
        y: 200,
        width: 120,
        height: 80,
        rotation: 30,
        zIndex: 3,
        name: 'Test Sticker'
      }
    ]
    store.selectedStickerIds = ['test-1']

    await wrapper.vm.$nextTick()

    const buttons = wrapper.findAll('.grid button')
    buttons.forEach((btn: any) => {
      expect(btn.classes()).toContain('transition-colors')
      expect(btn.classes()).toContain('hover:bg-gray-200')
    })
  })

  it('applies correct styling to multi-select info', async () => {
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
        name: 'Test 1'
      },
      {
        id: 'test-2',
        type: 'image',
        src: 'data:image/png;base64,test2',
        x: 200,
        y: 200,
        width: 150,
        height: 150,
        rotation: 45,
        zIndex: 2,
        name: 'Test 2'
      }
    ]
    store.selectedStickerIds = ['test-1', 'test-2']

    await wrapper.vm.$nextTick()

    const multiSelectInfo = wrapper.find('.bg-blue-50')
    expect(multiSelectInfo.exists()).toBe(true)
    expect(multiSelectInfo.classes()).toContain('rounded')
    expect(multiSelectInfo.classes()).toContain('p-3')

    const text = multiSelectInfo.find('.text-blue-700')
    expect(text.exists()).toBe(true)
    expect(text.classes()).toContain('text-sm')
  })

  it('handles edge cases for empty name', async () => {
    store.stickers = [
      {
        id: 'test-1',
        type: 'svg',
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>',
        x: 100,
        y: 200,
        width: 120,
        height: 80,
        rotation: 30,
        zIndex: 3,
        name: ''
      }
    ]
    store.selectedStickerIds = ['test-1']

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('名称: ')
  })

  it('handles minimum width constraint', async () => {
    store.stickers = [
      {
        id: 'test-1',
        type: 'svg',
        src: '<svg><circle cx="50" cy="50" r="40"/></svg>',
        x: 100,
        y: 200,
        width: 120,
        height: 80,
        rotation: 30,
        zIndex: 3,
        name: 'Test Sticker'
      }
    ]
    store.selectedStickerIds = ['test-1']

    await wrapper.vm.$nextTick()

    const updateWidthSpy = vi.spyOn(store, 'updateSticker')

    const widthInput = wrapper.findAll('input[type="number"]')[2]
    await widthInput.setValue('0')
    await widthInput.trigger('change')

    // Should not update with invalid width
    expect(updateWidthSpy).not.toHaveBeenCalled()
  })
})