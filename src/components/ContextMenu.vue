<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useCanvasStore } from '@/stores/canvas'

const store = useCanvasStore()
const contextMenuRef = ref<HTMLDivElement | null>(null)
const visible = ref(false)
const position = ref({ x: 0, y: 0 })
const targetStickerId = ref<string | null>(null)

const menuItems = [
  { id: 'duplicate', label: '复制', icon: '📋', shortcut: 'Ctrl+D' },
  { type: 'divider' },
  { id: 'bringFront', label: '置于顶层', icon: '⬆️' },
  { id: 'sendBack', label: '置于底层', icon: '⬇️' },
  { id: 'moveUp', label: '上移一层', icon: '👆' },
  { id: 'moveDown', label: '下移一层', icon: '👇' },
  { type: 'divider' },
  { id: 'selectAll', label: '全选', icon: '✅', shortcut: 'Ctrl+A' },
  { id: 'clearSelect', label: '取消选择', icon: '❌', shortcut: 'Esc' },
  { type: 'divider' },
  { id: 'delete', label: '删除', icon: '🗑️', shortcut: 'Delete' }
]

function show(x: number, y: number, stickerId?: string) {
  position.value = { x, y }
  targetStickerId.value = stickerId || null

  const menuWidth = 200
  const menuHeight = 320
  const padding = 10

  if (x + menuWidth > window.innerWidth - padding) {
    position.value.x = window.innerWidth - menuWidth - padding
  }
  if (y + menuHeight > window.innerHeight - padding) {
    position.value.y = window.innerHeight - menuHeight - padding
  }

  visible.value = true
}

function hide() {
  visible.value = false
  targetStickerId.value = null
}

function handleAction(action: string) {
  console.log('handleAction被调用:', action)
  try {
    switch (action) {
      case 'duplicate':
        if (targetStickerId.value) {
          store.duplicateSticker(targetStickerId.value)
        } else {
          store.duplicateSelectedStickers()
        }
        break
      case 'bringFront':
        if (targetStickerId.value) {
          store.bringToFront(targetStickerId.value)
        } else {
          store.bringSelectedToFront()
        }
        break
      case 'sendBack':
        if (targetStickerId.value) {
          store.sendToBack(targetStickerId.value)
        } else {
          store.sendSelectedToBack()
        }
        break
      case 'moveUp':
        if (targetStickerId.value) {
          store.moveUp(targetStickerId.value)
        } else {
          store.moveSelectedUp()
        }
        break
      case 'moveDown':
        if (targetStickerId.value) {
          store.moveDown(targetStickerId.value)
        } else {
          store.moveSelectedDown()
        }
        break
      case 'selectAll':
          store.selectedStickerIds = store.stickers.map(s => s.id)
          break
      case 'clearSelect':
        store.clearSelection()
        break
      case 'delete':
        console.log('ContextMenu删除操作:', { targetStickerId: targetStickerId.value, selectedIds: store.selectedStickerIds })
        if (targetStickerId.value) {
          console.log('删除单个贴纸:', targetStickerId.value)
          store.removeSticker(targetStickerId.value)
        } else {
          console.log('删除所有选中的贴纸:', store.selectedStickerIds)
          store.removeSelectedStickers()
        }
        break
      default:
        console.log('未知的操作:', action)
    }
  } catch (error) {
    console.error('handleAction错误:', error)
  }
  hide()
}

function handleClickOutside(e: MouseEvent) {
  if (contextMenuRef.value && !contextMenuRef.value.contains(e.target as Node)) {
    hide()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('contextmenu', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('contextmenu', handleClickOutside)
})

defineExpose({ show, hide })
</script>

<template>
  <div
    v-if="visible"
    ref="contextMenuRef"
    class="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-48"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
  >
    <template v-for="item in menuItems" :key="item.id || item.type">
      <div
        v-if="item.type === 'divider'"
        class="h-px bg-gray-200 my-1"
      />
      <button
        v-else
        class="w-full px-4 py-2 text-left text-sm flex items-center justify-between hover:bg-blue-50 transition-colors"
        @click="handleAction(item.id!)"
      >
        <span class="flex items-center gap-2">
          <span class="text-base">{{ item.icon }}</span>
          <span class="text-gray-700">{{ item.label }}</span>
        </span>
        <span v-if="item.shortcut" class="text-xs text-gray-400">{{ item.shortcut }}</span>
      </button>
    </template>

    <div v-if="!targetStickerId && store.selectedStickerIds.length > 0" class="px-4 py-1 text-xs text-gray-400 border-t mt-1 pt-1">
      已选择 {{ store.selectedStickerIds.length }} 个贴纸
    </div>
  </div>
</template>
