<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import type { Sticker } from '@/types'

const store = useCanvasStore()
const canvasWrapperRef = ref<HTMLDivElement | null>(null)

const isDragging = ref(false)
const isResizing = ref(false)
const isRotating = ref(false)
const isSelecting = ref(false)
const resizeDirection = ref('')
const dragStart = ref({ x: 0, y: 0 })
const stickerStartMap = ref<Map<string, { x: number; y: number; width: number; height: number; rotation: number }>>(new Map())
const selectionBox = ref({ x: 0, y: 0, width: 0, height: 0 })

const showGridLines = computed(() => store.settings.showGrid)

const gridStyle = computed(() => ({
  backgroundSize: `${store.settings.gridSize}px ${store.settings.gridSize}px`,
  backgroundImage: showGridLines.value 
    ? `linear-gradient(to right, ${store.settings.gridColor} 1px, transparent 1px),
       linear-gradient(to bottom, ${store.settings.gridColor} 1px, transparent 1px)`
    : 'none'
}))

const backgroundStyle = computed(() => {
  const { backgroundColor, backgroundGradient, backgroundImage } = store.settings
  const style: Record<string, string> = {}

  if (backgroundImage) {
    // 图片背景：先设置背景颜色，再叠加图片
    style.backgroundColor = backgroundColor
    style.backgroundImage = `url(${backgroundImage})`
    style.backgroundPosition = 'center'
    style.backgroundSize = 'cover'
    style.backgroundRepeat = 'no-repeat'
  } else if (backgroundGradient) {
    // 渐变背景：使用渐变，同时保持背景颜色作为后备
    style.backgroundColor = backgroundColor
    style.backgroundImage = backgroundGradient
  } else {
    // 纯色背景
    style.backgroundColor = backgroundColor
  }

  return style
})

const selectionBoxStyle = computed(() => ({
  left: `${selectionBox.value.x}px`,
  top: `${selectionBox.value.y}px`,
  width: `${selectionBox.value.width}px`,
  height: `${selectionBox.value.height}px`
}))

function getCanvasPoint(e: MouseEvent) {
  const wrapper = canvasWrapperRef.value
  if (!wrapper) return { x: 0, y: 0 }
  const rect = wrapper.getBoundingClientRect()

  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}

function handleCanvasMouseDown(e: MouseEvent) {
  if (e.button !== 0) return

  const point = getCanvasPoint(e)

  if ((e.target as HTMLElement).classList.contains('rotate-handle')) {
    const selected = store.selectedSticker
    if (selected) {
      isRotating.value = true
      
      // 计算所有选中贴纸的中心点
      let totalX = 0, totalY = 0, count = 0
      store.selectedStickerIds.forEach(id => {
        const sticker = store.stickers.find(s => s.id === id)
        if (sticker) {
          totalX += sticker.x + sticker.width / 2
          totalY += sticker.y + sticker.height / 2
          count++
        }
      })
      
      if (count > 0) {
        const centerX = totalX / count
        const centerY = totalY / count
        const angle = Math.atan2(point.y - centerY, point.x - centerX)
        dragStart.value = { x: angle * (180 / Math.PI), y: 0 }
        
        // 保存所有选中贴纸的初始状态
        store.selectedStickerIds.forEach(id => {
          const sticker = store.stickers.find(s => s.id === id)
          if (sticker) {
            stickerStartMap.value.set(id, { 
              x: sticker.x, 
              y: sticker.y, 
              width: sticker.width, 
              height: sticker.height, 
              rotation: sticker.rotation 
            })
          }
        })
        
        // 初始化批量旋转操作
        store.startBatchRotationOperation()
      }
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return
  }

  if (!e.shiftKey && !e.ctrlKey) {
    store.clearSelection()
  }

  isSelecting.value = true
  isDragging.value = false
  selectionBox.value = { x: point.x, y: point.y, width: 0, height: 0 }
  dragStart.value = { x: point.x, y: point.y }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function handleStickerMouseDown(e: MouseEvent, sticker: Sticker) {
  e.stopPropagation()

  if ((e.target as HTMLElement).classList.contains('resize-handle')) {
    isResizing.value = true
    resizeDirection.value = (e.target as HTMLElement).dataset.direction || ''
    stickerStartMap.value.set(sticker.id, { x: sticker.x, y: sticker.y, width: sticker.width, height: sticker.height, rotation: sticker.rotation })
    // 初始化缩放操作
    store.startScaleOperation(sticker.id, sticker.width, sticker.height)
  } else if ((e.target as HTMLElement).classList.contains('rotate-handle')) {
    isRotating.value = true
    const point = getCanvasPoint(e)
    const centerX = sticker.x + sticker.width / 2
    const centerY = sticker.y + sticker.height / 2
    const angle = Math.atan2(point.y - centerY, point.x - centerX)
    dragStart.value = { x: angle * (180 / Math.PI), y: 0 }
    stickerStartMap.value.set(sticker.id, { x: sticker.x, y: sticker.y, width: sticker.width, height: sticker.height, rotation: sticker.rotation })
  } else if (e.shiftKey || e.ctrlKey) {
    store.toggleSelectSticker(sticker.id)
    if (!isDragging.value) {
      isDragging.value = true
      dragStart.value = { x: e.clientX, y: e.clientY }
      store.selectedStickers.forEach(s => {
        stickerStartMap.value.set(s.id, { x: s.x, y: s.y, width: s.width, height: s.height, rotation: s.rotation })
      })
    }
  } else {
    if (!store.selectedStickerIds.includes(sticker.id)) {
      store.selectSticker(sticker.id)
    }
    isDragging.value = true
    dragStart.value = { x: e.clientX, y: e.clientY }
    store.selectedStickers.forEach(s => {
      stickerStartMap.value.set(s.id, { x: s.x, y: s.y, width: s.width, height: s.height, rotation: s.rotation })
    })
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function handleMouseMove(e: MouseEvent) {
  const point = getCanvasPoint(e)

  if (isSelecting.value) {
    const startX = Math.min(dragStart.value.x, point.x)
    const startY = Math.min(dragStart.value.y, point.y)
    const endX = Math.max(dragStart.value.x, point.x)
    const endY = Math.max(dragStart.value.y, point.y)

    selectionBox.value = {
      x: startX,
      y: startY,
      width: endX - startX,
      height: endY - startY
    }

    // 获取当前框选区域内的贴纸ID
    const stickersInBox: string[] = []
    store.stickers.forEach(sticker => {
      const stickerCenterX = sticker.x + sticker.width / 2
      const stickerCenterY = sticker.y + sticker.height / 2
      const inBox = stickerCenterX >= startX && stickerCenterX <= endX &&
                    stickerCenterY >= startY && stickerCenterY <= endY

      if (inBox) {
        stickersInBox.push(sticker.id)
      }
    })

    // 更新选择状态：只选择框选区域内的贴纸
    store.selectedStickerIds = stickersInBox

    return
  }

  if (store.selectedStickerIds.length === 0) return

  const dx = e.clientX - dragStart.value.x
  const dy = e.clientY - dragStart.value.y

  if (isDragging.value) {
    store.selectedStickerIds.forEach(id => {
      const start = stickerStartMap.value.get(id)
      if (start) {
        store.updateSticker(id, {
          x: start.x + dx,
          y: start.y + dy
        })
      }
    })
  } else if (isResizing.value) {
    const selectedId = store.selectedStickerIds[0]
    if (!selectedId) return
    const start = stickerStartMap.value.get(selectedId)
    if (!start) return

    let newWidth = start.width
    let newHeight = start.height
    let newX = start.x
    let newY = start.y

    switch (resizeDirection.value) {
      case 'se':
        newWidth = Math.max(20, start.width + dx)
        newHeight = Math.max(20, start.height + dy)
        break
      case 'sw':
        newWidth = Math.max(20, start.width - dx)
        newHeight = Math.max(20, start.height + dy)
        newX = start.x + dx
        break
      case 'ne':
        newWidth = Math.max(20, start.width + dx)
        newHeight = Math.max(20, start.height - dy)
        newY = start.y + dy
        break
      case 'nw':
        newWidth = Math.max(20, start.width - dx)
        newHeight = Math.max(20, start.height - dy)
        newX = start.x + dx
        newY = start.y + dy
        break
    }

    store.updateStickerScale(selectedId!, newWidth, newHeight)
    // 单独更新位置（如果有变化）
    if (newX !== start.x || newY !== start.y) {
      store.updateSticker(selectedId!, { x: newX, y: newY })
    }
  } else if (isRotating.value) {
    // 批量旋转所有选中的贴纸
    if (store.selectedStickerIds.length === 0) return
    
    // 计算所有选中贴纸的中心点
    let totalX = 0, totalY = 0, count = 0
    store.selectedStickerIds.forEach(id => {
      const start = stickerStartMap.value.get(id)
      if (start) {
        totalX += start.x + start.width / 2
        totalY += start.y + start.height / 2
        count++
      }
    })
    if (count === 0) return
    
    const centerX = totalX / count
    const centerY = totalY / count
    
    // 计算当前鼠标角度相对于起始点的变化
    const currentAngle = Math.atan2(point.y - centerY, point.x - centerX) * (180 / Math.PI)
    const rotationDelta = currentAngle - dragStart.value.x
    
    // 使用批量旋转函数处理所有贴纸
    store.selectedStickerIds.forEach(id => {
      const start = stickerStartMap.value.get(id)
      if (start) {
        const finalRotation = start.rotation + rotationDelta
        store.updateStickerRotation(id, finalRotation)
      }
    })
  }
}

function handleMouseUp() {
  isDragging.value = false
  isResizing.value = false
  isRotating.value = false
  isSelecting.value = false
  selectionBox.value = { x: 0, y: 0, width: 0, height: 0 }
  resizeDirection.value = ''
  stickerStartMap.value.clear()
  
  // 确保立即保存任何待处理的历史记录
  if (store.rotationSaveTimeout && store.rotationSaveTimeout.value) {
    clearTimeout(store.rotationSaveTimeout.value)
    store.rotationSaveTimeout.value = null
    store.saveHistory('rotate_sticker')
  }
  if (store.scaleSaveTimeout && store.scaleSaveTimeout.value) {
    clearTimeout(store.scaleSaveTimeout.value)
    store.scaleSaveTimeout.value = null
    store.saveHistory('scale_sticker')
  }

  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

function handleStickerContextMenu(e: MouseEvent, stickerId: string) {
  console.log('handleStickerContextMenu被调用:', { stickerId, selectedIds: store.selectedStickerIds })
  e.preventDefault()
  e.stopPropagation()

  // 如果当前有多个选中的贴纸，并且右键点击的是已选中的贴纸之一，则保持多选状态
  if (store.selectedStickerIds.length > 1 && store.selectedStickerIds.includes(stickerId)) {
    console.log('保持多选状态')
    // 保持当前的多选状态，不单独选择这个贴纸
  } else {
    console.log('单独选择贴纸:', stickerId)
    // 否则，单独选择这个贴纸
    store.selectSticker(stickerId)
  }

  console.log('发送showContextMenu事件:', { x: e.clientX, y: e.clientY, stickerId })
  // 多选时传递null，单选时传递具体的stickerId
  emit('showContextMenu', {
    x: e.clientX,
    y: e.clientY,
    stickerId: store.selectedStickerIds.length > 1 && store.selectedStickerIds.includes(stickerId) ? undefined : stickerId
  })
}

function handleCanvasContextMenu(e: MouseEvent) {
  e.preventDefault()
  emit('showContextMenu', {
    x: e.clientX,
    y: e.clientY,
    canvas: true
  })
}

const emit = defineEmits<{
  (e: 'showContextMenu', data: { x: number; y: number; stickerId?: string; canvas?: boolean }): void
}>()

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})

defineExpose({ canvasWrapperRef })
</script>

<template>
  <div 
    ref="canvasWrapperRef"
    class="relative"
  >
    <div 
      class="relative canvas-shadow"
      :style="[
        backgroundStyle,
        {
          width: `${store.settings.width}px`,
          height: `${store.settings.height}px`
        }
      ]"
      @mousedown="handleCanvasMouseDown"
      @mouseup="handleMouseUp"
      @contextmenu="handleCanvasContextMenu"
    >
      <!-- 网格层 -->
      <div 
        v-if="showGridLines"
        class="absolute inset-0 pointer-events-none"
        :style="gridStyle"
      ></div>
      <div 
        v-for="sticker in store.stickers" 
        :key="sticker.id"
        class="sticker-wrapper absolute cursor-move transition-shadow"
        :class="{ 
          'sticker-selected': store.selectedStickerIds.length === 1 && store.selectedStickerIds[0] === sticker.id,
          'sticker-multi-selected': store.selectedStickerIds.length > 1 && store.selectedStickerIds.includes(sticker.id)
        }"
        :data-id="sticker.id"
        :style="{
          left: `${sticker.x}px`,
          top: `${sticker.y}px`,
          width: `${sticker.width}px`,
          height: `${sticker.height}px`,
          zIndex: sticker.zIndex,
          transform: `rotate(${sticker.rotation}deg)`
        }"
        @mousedown="(e) => handleStickerMouseDown(e, sticker)"
        @contextmenu="(e) => handleStickerContextMenu(e, sticker.id)"
      >
        <img 
          v-if="sticker.type === 'image'" 
          :src="sticker.src" 
          class="w-full h-full object-contain pointer-events-none select-none"
          draggable="false"
        />
        <div 
          v-else 
          class="w-full h-full pointer-events-none select-none"
          v-html="sticker.src"
        />

        <template v-if="store.selectedStickerIds.includes(sticker.id) && store.selectedStickerIds.length === 1">
          <div class="resize-handle nw" data-direction="nw"></div>
          <div class="resize-handle ne" data-direction="ne"></div>
          <div class="resize-handle sw" data-direction="sw"></div>
          <div class="resize-handle se" data-direction="se"></div>
          <div class="rotate-handle" data-direction="rotate">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
        </template>
      </div>

      <!-- 选择框 -->
      <div 
        v-if="isSelecting && selectionBox.width > 5 && selectionBox.height > 5"
        class="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none"
        :style="selectionBoxStyle"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.sticker-wrapper {
  user-select: none;
}

.sticker-wrapper:hover {
  outline: 1px dashed #3b82f6;
}

.sticker-multi-selected {
  outline: 1px dashed #60a5fa !important;
}

.rotate-handle {
  position: absolute;
  left: 50%;
  top: -40px;
  transform: translateX(-50%);
  width: 28px;
  height: 28px;
  background: #3b82f6;
  border: 2px solid white;
  border-radius: 50%;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.rotate-handle:hover {
  background: #2563eb;
  cursor: grab;
  transform: translateX(-50%) scale(1.1);
}

.rotate-handle:active {
  cursor: grabbing;
  transform: translateX(-50%) scale(0.95);
}

.rotate-handle::after {
  content: '';
  position: absolute;
  top: 26px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 16px;
  background: #3b82f6;
}
</style>
