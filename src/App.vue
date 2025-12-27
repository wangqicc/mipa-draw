<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import CanvasBoard from '@/components/CanvasBoard.vue'
import StickerPanel from '@/components/StickerPanel.vue'
import Toolbar from '@/components/Toolbar.vue'
import LayerManager from '@/components/LayerManager.vue'
import ContextMenu from '@/components/ContextMenu.vue'
import type { Sticker } from '@/types'

const store = useCanvasStore()
const canvasBoardRef = ref<InstanceType<typeof CanvasBoard> | null>(null)
const contextMenuRef = ref<InstanceType<typeof ContextMenu> | null>(null)
const showLayerManager = ref(true)

function handleDragOver(e: DragEvent) {
  e.preventDefault()
}

const scrollContainerRef = ref<HTMLDivElement | null>(null)

function handleDrop(e: DragEvent) {
  e.preventDefault()
  const stickerData = e.dataTransfer?.getData('sticker')
  if (!stickerData) return

  try {
    const sticker = JSON.parse(stickerData)
    const canvasBoardEl = canvasBoardRef.value?.$el
    const scrollContainer = scrollContainerRef.value
    if (!canvasBoardEl || !scrollContainer) return

    const rect = canvasBoardEl.getBoundingClientRect()

    const x = e.clientX - rect.left - 50
    const y = e.clientY - rect.top - 50

    const newSticker: Sticker = {
      id: crypto.randomUUID(),
      type: sticker.type,
      src: sticker.src,
      x,
      y,
      width: 100,
      height: 100,
      rotation: 0,
      zIndex: store.maxZIndex + 1,
      name: sticker.name
    }
    store.addSticker(newSticker)
  } catch (error) {
    console.error('解析贴纸数据失败:', error)
  }
}

function handleShowContextMenu(data: { x: number; y: number; stickerId?: string; canvas?: boolean }) {
  contextMenuRef.value?.show(data.x, data.y, data.stickerId)
}

function handleKeyboard(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case 'z':
        e.preventDefault()
        if (e.shiftKey) {
          store.redo()
        } else {
          store.undo()
        }
        break
      case 'y':
        e.preventDefault()
        store.redo()
        break
      case 'a':
        e.preventDefault()
        store.selectedStickerIds = store.stickers.map(s => s.id)
        break
      case 'd':
        e.preventDefault()
        if (store.selectedStickerIds.length > 0) {
          store.duplicateSelectedStickers()
        }
        break
      case 's':
        e.preventDefault()
        break
    }
  } else {
    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        if (!['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
          if (store.selectedStickerIds.length > 0) {
            store.removeSelectedStickers()
          }
        }
        break
      case 'Escape':
        store.clearSelection()
        break

    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyboard)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyboard)
})
</script>

<template>
  <div class="flex flex-col h-screen bg-gray-100">
    <Toolbar />

    <div class="flex-1 flex overflow-hidden">
      <div class="w-56 flex-shrink-0 border-r bg-white no-print">
        <StickerPanel />
      </div>

      <div ref="scrollContainerRef" class="flex-1 overflow-auto">
        <div 
          class="p-8 min-w-fit"
          @dragover="handleDragOver"
          @drop="handleDrop"
        >
          <CanvasBoard ref="canvasBoardRef" @show-context-menu="handleShowContextMenu" />
        </div>
      </div>

      <div v-if="showLayerManager" class="w-56 flex-shrink-0 border-l bg-white no-print">
        <LayerManager />
      </div>

      <button 
        class="fixed bottom-4 right-4 w-10 h-10 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors no-print flex items-center justify-center z-10"
        :class="{ 'bg-green-600': !showLayerManager }"
        @click="showLayerManager = !showLayerManager"
      >
        <svg v-if="showLayerManager" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </button>

      <ContextMenu ref="contextMenuRef" />
    </div>

    <div class="bg-gray-800 text-gray-300 px-4 py-1 text-xs flex justify-between items-center no-print">
      <span>快捷键: Ctrl+Z 撤销 | Ctrl+Y 重做 | Delete 删除 | Ctrl+A 全选 | Ctrl+D 复制 | Esc 取消选择</span>
      <span>画布: {{ store.settings.width }} × {{ store.settings.height }}px</span>
    </div>
  </div>
</template>
