import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ContextMenu from '@/components/ContextMenu.vue'
import { useCanvasStore } from '@/stores/canvas'

describe('ContextMenu.vue', () => {
  let wrapper: any
  let store: any

  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
    store = useCanvasStore()
    wrapper = mount(ContextMenu, {
      global: {
        plugins: [pinia]
      }
    })
  })

  it('renders correctly when hidden', () => {
    expect(wrapper.find('.fixed').exists()).toBe(false)
  })

  it('shows context menu at correct position', async () => {
    wrapper.vm.show(100, 200, 'sticker-123')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.fixed').exists()).toBe(true)
    expect(wrapper.vm.position).toEqual({ x: 100, y: 200 })
    expect(wrapper.vm.targetStickerId).toBe('sticker-123')
  })

  it('adjusts position when near screen edge', async () => {
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', { value: 400, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 400, writable: true })

    wrapper.vm.show(300, 300)
    await wrapper.vm.$nextTick()

    // Should adjust position to fit within screen
    expect(wrapper.vm.position.x).toBeLessThan(300)
    expect(wrapper.vm.position.y).toBeLessThan(300)
  })

  it('hides context menu', async () => {
    wrapper.vm.show(100, 200)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.fixed').exists()).toBe(true)

    wrapper.vm.hide()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.fixed').exists()).toBe(false)
  })

  it('renders all menu items correctly', async () => {
    wrapper.vm.show(100, 200)
    await wrapper.vm.$nextTick()

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(8) // All non-divider items

    // Check first button (duplicate)
    expect(buttons[0].text()).toContain('复制')
    expect(buttons[0].text()).toContain('📋')
    expect(buttons[0].text()).toContain('Ctrl+D')

    // Check last button (delete)
    expect(buttons[7].text()).toContain('删除')
    expect(buttons[7].text()).toContain('🗑️')
    expect(buttons[7].text()).toContain('Delete')
  })

  it('renders dividers between menu groups', async () => {
    wrapper.vm.show(100, 200)
    await wrapper.vm.$nextTick()

    const dividers = wrapper.findAll('.h-px')
    expect(dividers.length).toBe(3) // 3 dividers between 4 groups
  })

  it('handles duplicate action for single sticker', async () => {
    const duplicateSpy = vi.spyOn(store, 'duplicateSticker')

    wrapper.vm.show(100, 200, 'sticker-123')
    await wrapper.vm.$nextTick()

    const duplicateButton = wrapper.findAll('button')[0]
    await duplicateButton.trigger('click')

    expect(duplicateSpy).toHaveBeenCalledWith('sticker-123')
    expect(wrapper.find('.fixed').exists()).toBe(false) // Should hide after action
  })

  it('handles duplicate action for selected stickers', async () => {
    const duplicateSelectedSpy = vi.spyOn(store, 'duplicateSelectedStickers')
    store.selectedStickerIds = ['sticker-1', 'sticker-2']

    wrapper.vm.show(100, 200) // No target sticker
    await wrapper.vm.$nextTick()

    const duplicateButton = wrapper.findAll('button')[0]
    await duplicateButton.trigger('click')

    expect(duplicateSelectedSpy).toHaveBeenCalled()
    expect(wrapper.find('.fixed').exists()).toBe(false)
  })

  it('handles bring to front action', async () => {
    const bringToFrontSpy = vi.spyOn(store, 'bringToFront')

    wrapper.vm.show(100, 200, 'sticker-123')
    await wrapper.vm.$nextTick()

    const bringFrontButton = wrapper.findAll('button')[1]
    await bringFrontButton.trigger('click')

    expect(bringToFrontSpy).toHaveBeenCalledWith('sticker-123')
  })

  it('handles send to back action', async () => {
    const sendToBackSpy = vi.spyOn(store, 'sendToBack')

    wrapper.vm.show(100, 200, 'sticker-123')
    await wrapper.vm.$nextTick()

    const sendBackButton = wrapper.findAll('button')[2]
    await sendBackButton.trigger('click')

    expect(sendToBackSpy).toHaveBeenCalledWith('sticker-123')
  })

  it('handles select all action', async () => {
    store.stickers = [
      { id: 'sticker-1', content: 'test1', x: 0, y: 0, zIndex: 1 },
      { id: 'sticker-2', content: 'test2', x: 0, y: 0, zIndex: 2 }
    ]

    wrapper.vm.show(100, 200)
    await wrapper.vm.$nextTick()

    const selectAllButton = wrapper.findAll('button')[5]
    await selectAllButton.trigger('click')

    expect(store.selectedStickerIds).toEqual(['sticker-1', 'sticker-2'])
  })

  it('handles clear selection action', async () => {
    const clearSelectionSpy = vi.spyOn(store, 'clearSelection')

    wrapper.vm.show(100, 200)
    await wrapper.vm.$nextTick()

    const clearSelectButton = wrapper.findAll('button')[6]
    await clearSelectButton.trigger('click')

    expect(clearSelectionSpy).toHaveBeenCalled()
  })

  it('handles delete action for single sticker', async () => {
    const removeStickerSpy = vi.spyOn(store, 'removeSticker')

    wrapper.vm.show(100, 200, 'sticker-123')
    await wrapper.vm.$nextTick()

    const deleteButton = wrapper.findAll('button').find((btn: any) => 
      btn.text().includes('删除')
    )
    if (deleteButton) {
      await deleteButton.trigger('click')
    }

    expect(removeStickerSpy).toHaveBeenCalledWith('sticker-123')
  })

  it('handles delete action for selected stickers', async () => {
    const removeSelectedSpy = vi.spyOn(store, 'removeSelectedStickers')
    store.selectedStickerIds = ['sticker-1', 'sticker-2']

    wrapper.vm.show(100, 200) // No target sticker
    await wrapper.vm.$nextTick()

    const deleteButton = wrapper.findAll('button').find((btn: any) => 
      btn.text().includes('删除')
    )
    if (deleteButton) {
      await deleteButton.trigger('click')
    }

    expect(removeSelectedSpy).toHaveBeenCalled()
  })

  it('shows selection count when stickers are selected', async () => {
    store.selectedStickerIds = ['sticker-1', 'sticker-2', 'sticker-3']

    wrapper.vm.show(100, 200) // No target sticker
    await wrapper.vm.$nextTick()

    const selectionInfo = wrapper.find('.border-t')
    expect(selectionInfo.exists()).toBe(true)
    expect(selectionInfo.text()).toContain('已选择 3 个贴纸')
  })

  it('does not show selection count when no stickers selected', async () => {
    store.selectedStickerIds = []

    wrapper.vm.show(100, 200)
    await wrapper.vm.$nextTick()

    const selectionInfo = wrapper.find('.border-t')
    expect(selectionInfo.exists()).toBe(false)
  })

  it('handles click outside to hide menu', async () => {
    wrapper.vm.show(100, 200)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.fixed').exists()).toBe(true)

    // Simulate click outside
    const clickEvent = new MouseEvent('click', { bubbles: true })
    document.dispatchEvent(clickEvent)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.fixed').exists()).toBe(false)
  })

  it('does not hide when clicking inside menu', async () => {
    wrapper.vm.show(100, 200)
    await wrapper.vm.$nextTick()

    const menuElement = wrapper.find('.fixed')
    expect(menuElement.exists()).toBe(true)

    // Simulate click inside menu
    const clickEvent = new MouseEvent('click', { bubbles: true })
    menuElement.element.dispatchEvent(clickEvent)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.fixed').exists()).toBe(true)
  })

  it('handles contextmenu event to hide menu', async () => {
    wrapper.vm.show(100, 200)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.fixed').exists()).toBe(true)

    // Simulate right-click outside
    const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true })
    document.dispatchEvent(contextMenuEvent)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.fixed').exists()).toBe(false)
  })

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

    wrapper.unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('contextmenu', expect.any(Function))
  })

  it('exposes show and hide methods', () => {
    expect(typeof wrapper.vm.show).toBe('function')
    expect(typeof wrapper.vm.hide).toBe('function')
  })

  it('handles unknown actions gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'log')

    wrapper.vm.show(100, 200)
    await wrapper.vm.$nextTick()

    // Manually trigger an unknown action
    wrapper.vm.handleAction('unknown-action')
    await wrapper.vm.$nextTick()

    expect(consoleSpy).toHaveBeenCalledWith('未知的操作:', 'unknown-action')
    expect(wrapper.vm.visible).toBe(false) // Should hide after action
  })

  it('handles action errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error')
    const store = useCanvasStore()

    // Mock store method to throw error
    vi.spyOn(store, 'duplicateSticker').mockImplementation(() => {
      throw new Error('Test error')
    })

    wrapper.vm.show(100, 200, 'sticker-123')
    await wrapper.vm.$nextTick()

    const duplicateButton = wrapper.findAll('button')[0]
    await duplicateButton.trigger('click')

    expect(consoleSpy).toHaveBeenCalledWith('handleAction错误:', expect.any(Error))
    expect(wrapper.find('.fixed').exists()).toBe(false) // Should still hide
  })
})