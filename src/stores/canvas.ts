import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Sticker, CanvasSettings, HistoryState, OptimizedHistoryState, StickerDelta } from '@/types'

export const useCanvasStore = defineStore('canvas', () => {
  const settings = ref<CanvasSettings>({
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    backgroundGradient: undefined,
    backgroundImage: undefined,
    showGrid: true,
    gridSize: 20,
    gridColor: '#e5e7eb'
  })

  const stickers = ref<Sticker[]>([])
  const selectedStickerIds = ref<string[]>([])
  const history = ref<HistoryState[]>([])
  const historyIndex = ref(-1)

  // 优化后的历史记录系统
  const operationGroup = ref<string | null>(null)
  const groupTimeout = ref<number | null>(null)
  const lastStickerStates = ref<Map<string, Sticker>>(new Map())
  const maxHistorySize = 100 // 增加历史记录限制

  // 性能监控
  const historyStats = ref({
    totalOperations: 0,
    memoryUsage: 0,
    averageOperationTime: 0
  })

  const selectedSticker = computed(() => {
    if (selectedStickerIds.value.length === 1) {
      return stickers.value.find(s => s.id === selectedStickerIds.value[0])
    }
    return null
  })

  const selectedStickers = computed(() =>
    stickers.value.filter(s => selectedStickerIds.value.includes(s.id))
  )

  const maxZIndex = computed(() =>
    stickers.value.length > 0
      ? Math.max(...stickers.value.map(s => s.zIndex))
      : 0
  )

  function addSticker(sticker: Sticker) {
    sticker.zIndex = maxZIndex.value + 1
    stickers.value.push(sticker)
    selectedStickerIds.value = [sticker.id]
    saveHistory('add_sticker')
  }

  function removeSticker(id: string) {
    const index = stickers.value.findIndex(s => s.id === id)
    if (index !== -1) {
      stickers.value.splice(index, 1)
      selectedStickerIds.value = selectedStickerIds.value.filter(sid => sid !== id)
      saveHistory('remove_sticker')
    }
  }

  function removeSelectedStickers() {
    const idsToRemove = [...selectedStickerIds.value]
    // 使用filter一次性删除所有选中的贴纸，避免遍历过程中的数组修改问题
    stickers.value = stickers.value.filter(sticker => !idsToRemove.includes(sticker.id))
    // 清空选择
    selectedStickerIds.value = []
    saveHistory('remove_selected_stickers')
  }

  function updateSticker(id: string, updates: Partial<Sticker>) {
    const sticker = stickers.value.find(s => s.id === id)
    if (sticker) {
      // 如果是位置更新，启动操作分组
      if (updates.x !== undefined || updates.y !== undefined) {
        if (!operationGroup.value) {
          startOperationGroup('drag_stickers', 500)
        }
      }

      Object.assign(sticker, updates)
      saveHistory('update_sticker')
    }
  }

  function selectSticker(id: string | null) {
    if (id === null) {
      selectedStickerIds.value = []
    } else if (!selectedStickerIds.value.includes(id)) {
      selectedStickerIds.value = [id]
    }
  }

  function toggleSelectSticker(id: string) {
    const index = selectedStickerIds.value.indexOf(id)
    if (index === -1) {
      selectedStickerIds.value.push(id)
    } else {
      selectedStickerIds.value.splice(index, 1)
    }
  }

  function addToSelection(id: string) {
    if (!selectedStickerIds.value.includes(id)) {
      selectedStickerIds.value.push(id)
    }
  }

  function clearSelection() {
    selectedStickerIds.value = []
  }

  function bringToFront(id: string) {
    const sticker = stickers.value.find(s => s.id === id)
    if (sticker) {
      sticker.zIndex = maxZIndex.value + 1
      saveHistory()
    }
  }

  function bringSelectedToFront() {
    selectedStickerIds.value.forEach(id => bringToFront(id))
  }

  function sendToBack(id: string) {
    const sticker = stickers.value.find(s => s.id === id)
    if (sticker) {
      const minZIndex = stickers.value.length > 0
        ? Math.min(...stickers.value.map(s => s.zIndex))
        : 0
      sticker.zIndex = minZIndex - 1
      saveHistory()
    }
  }

  function sendSelectedToBack() {
    selectedStickerIds.value.forEach(id => sendToBack(id))
  }

  function moveUp(id: string) {
    const sticker = stickers.value.find(s => s.id === id)
    if (sticker) {
      sticker.zIndex += 1
      saveHistory()
    }
  }

  function moveSelectedUp() {
    selectedStickerIds.value.forEach(id => moveUp(id))
  }

  function moveDown(id: string) {
    const sticker = stickers.value.find(s => s.id === id)
    if (sticker) {
      sticker.zIndex -= 1
      saveHistory()
    }
  }

  function moveSelectedDown() {
    selectedStickerIds.value.forEach(id => moveDown(id))
  }

  function duplicateSticker(id: string) {
    const sticker = stickers.value.find(s => s.id === id)
    if (sticker) {
      const newSticker: Sticker = {
        ...sticker,
        id: crypto.randomUUID(),
        x: sticker.x + 20,
        y: sticker.y + 20,
        zIndex: maxZIndex.value + 1
      }
      stickers.value.push(newSticker)
      selectedStickerIds.value = [newSticker.id]
      saveHistory()
    }
  }

  function duplicateSelectedStickers() {
    const newIds: string[] = []
    selectedStickerIds.value.forEach(id => {
      const sticker = stickers.value.find(s => s.id === id)
      if (sticker) {
        const newSticker: Sticker = {
          ...sticker,
          id: crypto.randomUUID(),
          x: sticker.x + 20,
          y: sticker.y + 20,
          zIndex: maxZIndex.value + 1
        }
        stickers.value.push(newSticker)
        newIds.push(newSticker.id)
      }
    })
    selectedStickerIds.value = newIds
    saveHistory()
  }

  function saveHistory(operation = 'unknown') {
    const startTime = performance.now()

    try {
      // 清除之前的分组超时
      if (groupTimeout.value) {
        clearTimeout(groupTimeout.value)
        groupTimeout.value = null
      }

      // 截断当前索引之后的历史记录
      history.value = history.value.slice(0, historyIndex.value + 1)

      // 使用结构化克隆替代JSON序列化，性能更好
      let currentState
      try {
        currentState = structuredClone(stickers.value)
      } catch (error) {
        // 降级到JSON序列化
        currentState = JSON.parse(JSON.stringify(stickers.value))
      }

      history.value.push({
        stickers: currentState,
        timestamp: Date.now()
      })

      historyIndex.value = history.value.length - 1

      // 限制历史记录数量
      if (history.value.length > maxHistorySize) {
        history.value.shift()
        historyIndex.value--
      }

      // 重置操作分组
      operationGroup.value = null

      // 更新性能统计
      const endTime = performance.now()
      const operationTime = endTime - startTime
      historyStats.value.totalOperations++
      historyStats.value.averageOperationTime = 
        (historyStats.value.averageOperationTime * (historyStats.value.totalOperations - 1) + operationTime) / 
        historyStats.value.totalOperations
      historyStats.value.memoryUsage = JSON.stringify(history.value).length

    } catch (error) {
      console.error('保存历史记录失败:', error)
      // 降级到JSON序列化
      fallbackSaveHistory()
    }
  }

  function fallbackSaveHistory() {
    try {
      history.value = history.value.slice(0, historyIndex.value + 1)
      history.value.push({
        stickers: JSON.parse(JSON.stringify(stickers.value)),
        timestamp: Date.now()
      })
      historyIndex.value = history.value.length - 1

      if (history.value.length > maxHistorySize) {
        history.value.shift()
        historyIndex.value--
      }
    } catch (error) {
      console.error('历史记录降级保存失败:', error)
    }
  }

  function undo() {
    try {
      if (historyIndex.value > 0) {
        historyIndex.value--
        const state = history.value[historyIndex.value]
        if (state && state.stickers) {
          // 使用结构化克隆确保数据独立性
          try {
            stickers.value = structuredClone(state.stickers)
          } catch (error) {
            // 降级到JSON拷贝
            stickers.value = JSON.parse(JSON.stringify(state.stickers))
          }
        }
      }
    } catch (error) {
      console.error('撤销操作失败:', error)
      fallbackUndo()
    }
  }

  function fallbackUndo() {
    if (historyIndex.value > 0) {
      historyIndex.value--
      const state = history.value[historyIndex.value]
      if (state && state.stickers) {
        stickers.value = JSON.parse(JSON.stringify(state.stickers))
      }
    }
  }

  function redo() {
    try {
      if (historyIndex.value < history.value.length - 1) {
        historyIndex.value++
        const state = history.value[historyIndex.value]
        if (state && state.stickers) {
          // 使用结构化克隆确保数据独立性
          try {
            stickers.value = structuredClone(state.stickers)
          } catch (error) {
            // 降级到JSON拷贝
            stickers.value = JSON.parse(JSON.stringify(state.stickers))
          }
        }
      }
    } catch (error) {
      console.error('重做操作失败:', error)
      fallbackRedo()
    }
  }

  function fallbackRedo() {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      const state = history.value[historyIndex.value]
      if (state && state.stickers) {
        stickers.value = JSON.parse(JSON.stringify(state.stickers))
      }
    }
  }

  function clearCanvas() {
    stickers.value = []
    selectedStickerIds.value = []
    saveHistory()
  }

  // 操作分组功能
  function startOperationGroup(operation: string, timeout = 1000) {
    // 如果已有分组，清除超时
    if (operationGroup.value && groupTimeout.value) {
      clearTimeout(groupTimeout.value)
    }

    operationGroup.value = operation

    // 设置分组超时 - 兼容测试环境
    if (typeof window !== 'undefined') {
      groupTimeout.value = window.setTimeout(() => {
        operationGroup.value = null
        groupTimeout.value = null
      }, timeout)
    }
  }

  function saveStickerStateBeforeOperation(stickerId: string) {
    const sticker = stickers.value.find(s => s.id === stickerId)
    if (sticker) {
      try {
        lastStickerStates.value.set(stickerId, structuredClone(sticker))
      } catch (error) {
        // 降级到JSON拷贝
        lastStickerStates.value.set(stickerId, JSON.parse(JSON.stringify(sticker)))
      }
    }
  }

  function clearOperationGroup() {
    if (groupTimeout.value) {
      clearTimeout(groupTimeout.value)
      groupTimeout.value = null
    }
    operationGroup.value = null
    lastStickerStates.value.clear()
  }

  function getHistoryDebugInfo() {
    return {
      historyLength: history.value.length,
      historyIndex: historyIndex.value,
      currentState: stickers.value.length,
      stats: historyStats.value
    }
  }



  watch(() => stickers.value.length, () => {
    if (history.value.length === 0) {
      saveHistory()
    }
  }, { immediate: true })

  return {
    settings,
    stickers,
    selectedStickerIds,
    selectedSticker,
    selectedStickers,
    maxZIndex,
    // 新增历史记录统计
    historyStats,
    addSticker,
    removeSticker,
    removeSelectedStickers,
    updateSticker,
    selectSticker,
    toggleSelectSticker,
    addToSelection,
    clearSelection,
    bringToFront,
    bringSelectedToFront,
    sendToBack,
    sendSelectedToBack,
    moveUp,
    moveSelectedUp,
    moveDown,
    moveSelectedDown,
    duplicateSticker,
    duplicateSelectedStickers,
    undo,
    redo,
    clearCanvas,
    // 新增的操作分组功能
    startOperationGroup,
    saveStickerStateBeforeOperation,
    clearOperationGroup,
    getHistoryDebugInfo
  }
})
