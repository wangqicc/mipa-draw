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

  // 旋转和缩放专用状态
  const rotationStartValue = ref<number>(0)
  const scaleStartValues = ref<{width: number, height: number}>({width: 0, height: 0})
  const transformationThreshold = ref({
    rotation: 5, // 旋转阈值：5度
    scale: 10, // 缩放阈值：10像素
    position: 15 // 位置阈值：15像素
  })

  // 量化设置
  const quantization = ref({
    rotation: 5, // 旋转量化到5度的倍数
    scale: 5, // 缩放量化到5像素的倍数
    position: 10 // 位置量化到10像素的倍数
  })

  // 独立的延迟保存超时
  const rotationSaveTimeout = ref<number | null>(null)
  const scaleSaveTimeout = ref<number | null>(null)
  const positionSaveTimeout = ref<number | null>(null)

  // 性能监控
  const historyStats = ref({
    totalOperations: 0,
    memoryUsage: 0,
    averageOperationTime: 0
  })

  // 优化常量
  const ZINDEX_COMPRESSION_THRESHOLD = 1000
  const ZINDEX_BATCH_SIZE = 100
  const PERFORMANCE_THRESHOLD = 16 // 16ms = 1帧的时间
  const HISTORY_COMPRESSION_INTERVAL = 50 // 每50个操作进行一次压缩

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

  // 验证函数
  function validateSticker(sticker: Sticker): boolean {
    if (!sticker.id || !sticker.type || !sticker.src) {
      console.warn('Invalid sticker: missing required fields', { id: sticker.id, type: sticker.type, src: sticker.src })
      return false
    }
    if (sticker.width <= 0 || sticker.height <= 0) {
      console.warn('Invalid sticker: invalid dimensions', { width: sticker.width, height: sticker.height })
      return false
    }
    if (sticker.x < 0 || sticker.y < 0) {
      console.warn('Invalid sticker: negative position', { x: sticker.x, y: sticker.y })
      return false
    }
    return true
  }

  // 状态一致性检查
  function checkStateConsistency(): void {
    // 检查选择状态的一致性
    const validSelectedIds = selectedStickerIds.value.filter(id => 
      stickers.value.some(sticker => sticker.id === id)
    )
    if (validSelectedIds.length !== selectedStickerIds.value.length) {
      console.warn('State inconsistency detected: cleaning up selected sticker IDs')
      selectedStickerIds.value = validSelectedIds
    }
  }

  // 智能zIndex计算
  function calculateOptimalZIndex(): number {
    const currentMax = maxZIndex.value
    const stickerCount = stickers.value.length
    
    // 根据贴纸数量动态调整zIndex分配策略
    if (stickerCount < 10) {
      return currentMax + 1
    } else if (stickerCount < 100) {
      return currentMax + 10
    } else {
      // 大量贴纸时，使用批量分配
      return Math.ceil(currentMax / ZINDEX_BATCH_SIZE) * ZINDEX_BATCH_SIZE + ZINDEX_BATCH_SIZE
    }
  }

  // 性能监控
  function monitorPerformance<T>(operation: () => T, operationName: string): T {
    const startTime = performance.now()
    try {
      const result = operation()
      const endTime = performance.now()
      const operationTime = endTime - startTime
      
      if (operationTime > PERFORMANCE_THRESHOLD) {
        console.warn(`Operation ${operationName} took ${operationTime.toFixed(2)}ms, exceeding threshold of ${PERFORMANCE_THRESHOLD}ms`)
      }
      
      return result
    } catch (error) {
      const endTime = performance.now()
      console.error(`Operation ${operationName} failed after ${(endTime - startTime).toFixed(2)}ms:`, error)
      throw error
    }
  }

  // 确保历史记录初始化
  function ensureHistoryInitialized(): void {
    if (history.value.length === 0) {
      // 保存初始空状态
      history.value.push({
        stickers: [],
        selectedStickerIds: [],
        timestamp: Date.now() - 1
      } as HistoryState)
      historyIndex.value = 0
    }
  }

  function addSticker(sticker: Sticker) {
    return monitorPerformance(() => {
      // 验证贴纸数据
      if (!validateSticker(sticker)) {
        throw new Error('Invalid sticker data')
      }

      // 创建新的贴纸对象，避免修改原对象
      const newSticker = {
        ...sticker,
        zIndex: calculateOptimalZIndex()
      }
      
      stickers.value.push(newSticker)
      selectedStickerIds.value = [newSticker.id]

      // 检查状态一致性
      checkStateConsistency()

      // 如果层级过高，进行压缩
      if (newSticker.zIndex > ZINDEX_COMPRESSION_THRESHOLD) {
        compressZIndices()
      }

      // 确保历史记录初始化
      ensureHistoryInitialized()
      
      saveHistory('add_sticker')
      
      return newSticker
    }, 'addSticker')
  }

  function removeSticker(id: string) {
    return monitorPerformance(() => {
      const index = stickers.value.findIndex(s => s.id === id)
      if (index !== -1) {
        stickers.value.splice(index, 1)
        selectedStickerIds.value = selectedStickerIds.value.filter(sid => sid !== id)
        
        // 检查状态一致性
        checkStateConsistency()
        
        saveHistory('remove_sticker')
        return true
      }
      console.warn(`Sticker with id ${id} not found`)
      return false
    }, 'removeSticker')
  }

  function removeSelectedStickers() {
    return monitorPerformance(() => {
      const idsToRemove = [...selectedStickerIds.value]
      if (idsToRemove.length === 0) {
        console.warn('No stickers selected for removal')
        return 0
      }
      
      // 使用filter一次性删除所有选中的贴纸，避免遍历过程中的数组修改问题
      const beforeCount = stickers.value.length
      stickers.value = stickers.value.filter(sticker => !idsToRemove.includes(sticker.id))
      const removedCount = beforeCount - stickers.value.length
      
      // 清空选择
      selectedStickerIds.value = []
      
      // 检查状态一致性
      checkStateConsistency()
      
      if (removedCount > 0) {
        saveHistory('remove_selected_stickers')
      }
      
      return removedCount
    }, 'removeSelectedStickers')
  }

  function updateSticker(id: string, updates: Partial<Sticker>, options: { isDrag?: boolean; skipQuantization?: boolean } = {}) {
    return monitorPerformance(() => {
      const sticker = stickers.value.find(s => s.id === id)
      if (!sticker) {
        console.warn(`Sticker with id ${id} not found for update`)
        return false
      }

      // 验证更新数据
      if (updates.width !== undefined && updates.width <= 0) {
        console.warn('Invalid width update:', updates.width)
        return false
      }
      if (updates.height !== undefined && updates.height <= 0) {
        console.warn('Invalid height update:', updates.height)
        return false
      }

      let hasChanges = false

      // 如果是位置更新，使用更智能的历史记录管理
      if (updates.x !== undefined || updates.y !== undefined) {
        hasChanges = true
        
        // 如果是拖拽操作，应用量化和阈值
        if (options.isDrag && !options.skipQuantization) {
          // 量化位置变化
          const newX = updates.x !== undefined ? Math.round(updates.x / quantization.value.position) * quantization.value.position : sticker.x
          const newY = updates.y !== undefined ? Math.round(updates.y / quantization.value.position) * quantization.value.position : sticker.y

          // 检查移动距离是否达到阈值
          const moveDistance = Math.sqrt(
            Math.pow(newX - sticker.x, 2) + Math.pow(newY - sticker.y, 2)
          )

          if (moveDistance >= transformationThreshold.value.position) {
            // 保存当前状态，为撤销做准备
            saveStickerStateBeforeOperation(id)

            // 更新位置
            if (updates.x !== undefined) sticker.x = newX
            if (updates.y !== undefined) sticker.y = newY

            // 使用延迟保存，避免过于频繁的历史记录
            if (positionSaveTimeout.value) {
              clearTimeout(positionSaveTimeout.value)
            }
            positionSaveTimeout.value = window.setTimeout(() => {
              saveHistory('move_sticker')
            }, 500)
          }
        } else {
          // 程序性更新或跳过量化，直接应用位置变化
          const oldX = sticker.x
          const oldY = sticker.y
          if (updates.x !== undefined) sticker.x = updates.x
          if (updates.y !== undefined) sticker.y = updates.y
          
          // 如果位置有变化，保存历史记录
          if (oldX !== sticker.x || oldY !== sticker.y) {
            // 如果是跳过量化（如测试用例），立即保存历史记录
            if (options.skipQuantization) {
              saveHistory('update_sticker')
            } else {
              // 否则使用延迟保存，避免过于频繁的历史记录
              if (positionSaveTimeout.value) {
                clearTimeout(positionSaveTimeout.value)
              }
              positionSaveTimeout.value = window.setTimeout(() => {
                saveHistory('move_sticker')
              }, 500)
            }
          }
        }
      }

      // 处理非位置更新（宽度、高度、旋转等）
      const nonPositionUpdates: Partial<Sticker> = {}
      let hasNonPositionUpdates = false

      Object.keys(updates).forEach(key => {
        if (key !== 'x' && key !== 'y' && updates[key as keyof Sticker] !== undefined) {
          const oldValue = sticker[key as keyof Sticker]
          const newValue = updates[key as keyof Sticker]
          if (oldValue !== newValue) {
            (nonPositionUpdates as any)[key] = newValue
            hasNonPositionUpdates = true
            hasChanges = true
          }
        }
      })

      if (hasNonPositionUpdates) {
        Object.assign(sticker, nonPositionUpdates)
        saveHistory('update_sticker')
      }

      // 检查状态一致性
      checkStateConsistency()
      
      return hasChanges
    }, 'updateSticker')
  }

  // 优化的旋转操作 - 支持逐个撤销但保持批量操作流畅性
  function updateStickerRotation(id: string, rotation: number) {
    const sticker = stickers.value.find(s => s.id === id)
    if (sticker) {
      // 量化旋转角度
      const quantizedRotation = Math.round(rotation / quantization.value.rotation) * quantization.value.rotation

      // 检查是否需要创建新的历史记录（基于阈值）
      const rotationDiff = Math.abs(quantizedRotation - sticker.rotation)
      if (rotationDiff >= transformationThreshold.value.rotation) {
        // 保存当前贴纸的状态，为独立的撤销做准备
        saveStickerStateBeforeOperation(id)

        // 更新贴纸旋转角度
        sticker.rotation = quantizedRotation

        // 使用延迟保存，避免过于频繁的历史记录创建
        if (rotationSaveTimeout.value) {
          clearTimeout(rotationSaveTimeout.value)
        }
        rotationSaveTimeout.value = window.setTimeout(() => {
          saveHistory('rotate_sticker')
        }, 300)
      }
    }
  }

  // 优化的缩放操作 - 支持逐个撤销
  function updateStickerScale(id: string, width: number, height: number) {
    const sticker = stickers.value.find(s => s.id === id)
    if (sticker) {
      // 量化尺寸
      const quantizedWidth = Math.round(width / quantization.value.scale) * quantization.value.scale
      const quantizedHeight = Math.round(height / quantization.value.scale) * quantization.value.scale

      // 检查缩放变化是否达到阈值
      const widthDiff = Math.abs(quantizedWidth - sticker.width)
      const heightDiff = Math.abs(quantizedHeight - sticker.height)

      if (widthDiff >= transformationThreshold.value.scale || heightDiff >= transformationThreshold.value.scale) {
        // 保存当前贴纸的状态，为独立的撤销做准备
        saveStickerStateBeforeOperation(id)

        sticker.width = quantizedWidth
        sticker.height = quantizedHeight

        // 使用延迟保存，避免过于频繁的历史记录创建
        if (scaleSaveTimeout.value) {
          clearTimeout(scaleSaveTimeout.value)
        }
        scaleSaveTimeout.value = window.setTimeout(() => {
          saveHistory('scale_sticker')
        }, 300)
      }
    }
  }

  // 开始旋转操作
  function startRotationOperation(id: string, currentRotation: number) {
    rotationStartValue.value = currentRotation
    startOperationGroup('rotate_stickers', 1000)

    // 保存所有选中贴纸的初始状态
    selectedStickerIds.value.forEach(stickerId => {
      const sticker = stickers.value.find(s => s.id === stickerId)
      if (sticker) {
        saveStickerStateBeforeOperation(stickerId)
      }
    })
  }

  // 开始批量旋转操作
  function startBatchRotationOperation() {
    startOperationGroup('rotate_stickers', 1000)

    // 保存所有选中贴纸的初始状态
    selectedStickerIds.value.forEach(stickerId => {
      const sticker = stickers.value.find(s => s.id === stickerId)
      if (sticker) {
        saveStickerStateBeforeOperation(stickerId)
      }
    })
  }

  // 批量旋转贴纸 - 一次性处理所有贴纸
  function batchRotateStickers(centerX: number, centerY: number, newAngle: number) {
    const quantizedRotation = Math.round(newAngle / quantization.value.rotation) * quantization.value.rotation
    const rotationDiff = Math.abs(quantizedRotation - rotationStartValue.value)

    if (rotationDiff >= transformationThreshold.value.rotation) {
      if (!operationGroup.value || !operationGroup.value.startsWith('rotate')) {
        startBatchRotationOperation()
        rotationStartValue.value = quantizedRotation
      }

      // 批量更新所有贴纸的旋转角度
      selectedStickerIds.value.forEach(stickerId => {
        const sticker = stickers.value.find(s => s.id === stickerId)
        if (sticker && lastStickerStates.value.has(stickerId)) {
          const originalState = lastStickerStates.value.get(stickerId)!
          const originalAngle = Math.atan2(
            originalState.y + originalState.height / 2 - centerY,
            originalState.x + originalState.width / 2 - centerX
          ) * (180 / Math.PI)
          const newRotation = originalState.rotation + (newAngle - originalAngle)
          sticker.rotation = Math.round(newRotation / quantization.value.rotation) * quantization.value.rotation
        }
      })

      // 延迟保存历史记录
      if (!groupTimeout.value) {
        groupTimeout.value = window.setTimeout(() => {
          saveHistory('batch_rotate_stickers')
        }, 200)
      }
    }
  }

  // 开始缩放操作
  function startScaleOperation(id: string, currentWidth: number, currentHeight: number) {
    scaleStartValues.value = {width: currentWidth, height: currentHeight}
    startOperationGroup('scale_stickers', 1000)
  }

  // 设置变换阈值
  function setTransformationThreshold(thresholds: {rotation?: number, scale?: number}) {
    if (thresholds.rotation !== undefined) {
      transformationThreshold.value.rotation = thresholds.rotation
    }
    if (thresholds.scale !== undefined) {
      transformationThreshold.value.scale = thresholds.scale
    }
  }

  // 设置量化参数
  function setQuantization(params: {rotation?: number, scale?: number}) {
    if (params.rotation !== undefined) {
      quantization.value.rotation = params.rotation
    }
    if (params.scale !== undefined) {
      quantization.value.scale = params.scale
    }
  }

  function selectSticker(id: string | null) {
    return monitorPerformance(() => {
      if (id === null) {
        selectedStickerIds.value = []
      } else if (!selectedStickerIds.value.includes(id)) {
        // 验证贴纸是否存在
        if (!stickers.value.some(s => s.id === id)) {
          console.warn(`Attempting to select non-existent sticker: ${id}`)
          return false
        }
        selectedStickerIds.value = [id]
      }
      return true
    }, 'selectSticker')
  }

  function toggleSelectSticker(id: string) {
    return monitorPerformance(() => {
      // 验证贴纸是否存在
      if (!stickers.value.some(s => s.id === id)) {
        console.warn(`Attempting to toggle selection for non-existent sticker: ${id}`)
        return false
      }
      
      const index = selectedStickerIds.value.indexOf(id)
      if (index === -1) {
        selectedStickerIds.value.push(id)
      } else {
        selectedStickerIds.value.splice(index, 1)
      }
      return true
    }, 'toggleSelectSticker')
  }

  function addToSelection(id: string) {
    return monitorPerformance(() => {
      // 验证贴纸是否存在
      if (!stickers.value.some(s => s.id === id)) {
        console.warn(`Attempting to add non-existent sticker to selection: ${id}`)
        return false
      }
      
      if (!selectedStickerIds.value.includes(id)) {
        selectedStickerIds.value.push(id)
      }
      return true
    }, 'addToSelection')
  }

  function clearSelection() {
    return monitorPerformance(() => {
      selectedStickerIds.value = []
      return true
    }, 'clearSelection')
  }

  function bringToFront(id: string) {
    return monitorPerformance(() => {
      const sticker = stickers.value.find(s => s.id === id)
      if (!sticker) {
        console.warn(`Sticker with id ${id} not found for bringToFront`)
        return false
      }
      
      const newZIndex = calculateOptimalZIndex()
      sticker.zIndex = newZIndex
      
      checkStateConsistency()
      saveHistory('bring_to_front')
      return true
    }, 'bringToFront')
  }

  function bringSelectedToFront() {
    return monitorPerformance(() => {
      if (selectedStickerIds.value.length === 0) {
        console.warn('No stickers selected for bringToFront')
        return 0
      }
      
      let successCount = 0
      selectedStickerIds.value.forEach(id => {
        if (bringToFront(id)) {
          successCount++
        }
      })
      return successCount
    }, 'bringSelectedToFront')
  }

  function sendToBack(id: string) {
    return monitorPerformance(() => {
      const sticker = stickers.value.find(s => s.id === id)
      if (!sticker) {
        console.warn(`Sticker with id ${id} not found for sendToBack`)
        return false
      }
      
      const minZIndex = stickers.value.length > 0
        ? Math.min(...stickers.value.map(s => s.zIndex))
        : 0
      sticker.zIndex = minZIndex - 1
      
      checkStateConsistency()
      saveHistory('send_to_back')
      return true
    }, 'sendToBack')
  }

  function sendSelectedToBack() {
    return monitorPerformance(() => {
      if (selectedStickerIds.value.length === 0) {
        console.warn('No stickers selected for sendToBack')
        return 0
      }
      
      let successCount = 0
      selectedStickerIds.value.forEach(id => {
        if (sendToBack(id)) {
          successCount++
        }
      })
      return successCount
    }, 'sendSelectedToBack')
  }

  function moveUp(id: string) {
    return monitorPerformance(() => {
      const sticker = stickers.value.find(s => s.id === id)
      if (!sticker) {
        console.warn(`Sticker with id ${id} not found for moveUp`)
        return false
      }
      
      sticker.zIndex += 1
      checkStateConsistency()
      saveHistory('move_up')
      return true
    }, 'moveUp')
  }

  function moveSelectedUp() {
    return monitorPerformance(() => {
      if (selectedStickerIds.value.length === 0) {
        console.warn('No stickers selected for moveUp')
        return 0
      }
      
      let successCount = 0
      selectedStickerIds.value.forEach(id => {
        if (moveUp(id)) {
          successCount++
        }
      })
      return successCount
    }, 'moveSelectedUp')
  }

  function moveDown(id: string) {
    return monitorPerformance(() => {
      const sticker = stickers.value.find(s => s.id === id)
      if (!sticker) {
        console.warn(`Sticker with id ${id} not found for moveDown`)
        return false
      }
      
      sticker.zIndex -= 1
      checkStateConsistency()
      saveHistory('move_down')
      return true
    }, 'moveDown')
  }

  function moveSelectedDown() {
    return monitorPerformance(() => {
      if (selectedStickerIds.value.length === 0) {
        console.warn('No stickers selected for moveDown')
        return 0
      }
      
      let successCount = 0
      selectedStickerIds.value.forEach(id => {
        if (moveDown(id)) {
          successCount++
        }
      })
      return successCount
    }, 'moveSelectedDown')
  }

  function duplicateSticker(id: string) {
    return monitorPerformance(() => {
      const sticker = stickers.value.find(s => s.id === id)
      if (!sticker) {
        console.warn(`Sticker with id ${id} not found for duplication`)
        return null
      }

      const newSticker: Sticker = {
        ...sticker,
        id: crypto.randomUUID(),
        x: sticker.x + 20,
        y: sticker.y + 20,
        // 复制的贴纸使用智能zIndex计算
        zIndex: calculateOptimalZIndex()
      }
      
      stickers.value.push(newSticker)
      selectedStickerIds.value = [newSticker.id]
      
      checkStateConsistency()
      saveHistory('duplicate_sticker')
      
      return newSticker
    }, 'duplicateSticker')
  }

  function duplicateSelectedStickers() {
    return monitorPerformance(() => {
      if (selectedStickerIds.value.length === 0) {
        console.warn('No stickers selected for duplication')
        return []
      }

      const newIds: string[] = []
      const newStickers: Sticker[] = []
      
      selectedStickerIds.value.forEach(id => {
        const sticker = stickers.value.find(s => s.id === id)
        if (sticker) {
          const newSticker: Sticker = {
            ...sticker,
            id: crypto.randomUUID(),
            x: sticker.x + 20,
            y: sticker.y + 20,
            // 复制的贴纸使用智能zIndex计算
            zIndex: calculateOptimalZIndex()
          }
          stickers.value.push(newSticker)
          newIds.push(newSticker.id)
          newStickers.push(newSticker)
        }
      })
      
      selectedStickerIds.value = newIds
      
      checkStateConsistency()
      
      if (newStickers.length > 0) {
        saveHistory('duplicate_selected_stickers')
      }
      
      return newStickers
    }, 'duplicateSelectedStickers')
  }

  // 压缩层级，避免层级无限增长
  function compressZIndices() {
    return monitorPerformance(() => {
      if (stickers.value.length <= 1) return 0

      // 按zIndex排序
      const sortedStickers = [...stickers.value].sort((a, b) => a.zIndex - b.zIndex)

      // 重新分配层级，从1开始，保持相对顺序
      sortedStickers.forEach((sticker, index) => {
        sticker.zIndex = index + 1
      })

      checkStateConsistency()
      saveHistory('compress_z_indices')
      
      return sortedStickers.length
    }, 'compressZIndices')
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
        selectedStickerIds: [...selectedStickerIds.value],
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
        selectedStickerIds: [...selectedStickerIds.value],
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
      // 允许撤销到第一个历史记录（包括初始状态）
      if (historyIndex.value >= 1) {
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
          
          // 同时恢复选择状态
          if (state.selectedStickerIds) {
            selectedStickerIds.value = state.selectedStickerIds
          } else {
            // 兼容旧的历史记录格式
            selectedStickerIds.value = []
          }
        }
      }
    } catch (error) {
      console.error('撤销操作失败:', error)
      fallbackUndo()
    }
  }

  function fallbackUndo() {
    // 允许撤销到第一个历史记录（包括初始状态）
    if (historyIndex.value >= 1) {
      historyIndex.value--
      const state = history.value[historyIndex.value]
      if (state && state.stickers) {
        stickers.value = JSON.parse(JSON.stringify(state.stickers))
        
        // 同时恢复选择状态
        if (state.selectedStickerIds) {
          selectedStickerIds.value = state.selectedStickerIds
        } else {
          // 兼容旧的历史记录格式
          selectedStickerIds.value = []
        }
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
          
          // 同时恢复选择状态
          if (state.selectedStickerIds) {
            selectedStickerIds.value = state.selectedStickerIds
          } else {
            // 兼容旧的历史记录格式
            selectedStickerIds.value = []
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
        
        // 同时恢复选择状态
        if (state.selectedStickerIds) {
          selectedStickerIds.value = state.selectedStickerIds
        } else {
          // 兼容旧的历史记录格式
          selectedStickerIds.value = []
        }
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

    // 确保保存任何待处理的历史记录
    if (rotationSaveTimeout.value) {
      clearTimeout(rotationSaveTimeout.value)
      rotationSaveTimeout.value = null
      saveHistory('rotate_sticker')
    }
    if (scaleSaveTimeout.value) {
      clearTimeout(scaleSaveTimeout.value)
      scaleSaveTimeout.value = null
      saveHistory('scale_sticker')
    }
    if (positionSaveTimeout.value) {
      clearTimeout(positionSaveTimeout.value)
      positionSaveTimeout.value = null
      saveHistory('move_sticker')
    }
  }

  function getHistoryDebugInfo() {
    return {
      historyLength: history.value.length,
      historyIndex: historyIndex.value,
      currentState: stickers.value.length,
      stats: historyStats.value
    }
  }



  // 改进的历史记录初始化 - 确保初始状态被保存
  let isInitialized = false
  
  watch(() => stickers.value.length, (newLength, oldLength) => {
    // 只在第一次从0到1时初始化历史记录
    if (!isInitialized && newLength === 1 && oldLength === 0) {
      // 先保存初始空状态
      if (history.value.length === 0) {
        history.value.push({
          stickers: [],
          selectedStickerIds: [],
          timestamp: Date.now() - 1
        } as HistoryState)
        historyIndex.value = 0
      }
      isInitialized = true
    }
  })

  return {
    settings,
    stickers,
    selectedStickerIds,
    selectedSticker,
    selectedStickers,
    maxZIndex,
    // 新增历史记录统计
    history,
    historyIndex,
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
    saveHistory,
    // 新增的操作分组功能
    startOperationGroup,
    saveStickerStateBeforeOperation,
    clearOperationGroup,
    getHistoryDebugInfo,
    // 新增的旋转和缩放优化函数
    updateStickerRotation,
    updateStickerScale,
    startRotationOperation,
    startScaleOperation,
    startBatchRotationOperation,
    batchRotateStickers,
    // 新增的设置函数
    setTransformationThreshold,
    setQuantization,
    // 新增的超时变量访问
    rotationSaveTimeout,
    scaleSaveTimeout,
    positionSaveTimeout,
    // 新增的层级压缩功能
    compressZIndices
  }
})
