<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'

const store = useCanvasStore()

const sortedStickers = computed(() => {
  return [...store.stickers].sort((a, b) => b.zIndex - a.zIndex)
})

function handleSelect(id: string) {
  store.selectSticker(id)
}

function handleDelete(id: string) {
  store.removeSticker(id)
}

function handleBringToFront(id: string) {
  store.bringToFront(id)
}

function handleSendToBack(id: string) {
  store.sendToBack(id)
}

function handleMoveUp(id: string) {
  store.moveUp(id)
}

function handleMoveDown(id: string) {
  store.moveDown(id)
}

function handleDuplicate(id: string) {
  store.duplicateSticker(id)
}

function formatName(name: string, type: string) {
  // 如果没有name属性，使用type作为备用
  const displayName = name || type || '未命名'
  return displayName.length > 10 ? displayName.substring(0, 10) + '...' : displayName
}

function isSelected(id: string) {
  return store.selectedStickerIds.includes(id)
}
</script>

<template>
  <div class="flex flex-col h-full bg-white rounded-lg shadow">
    <div class="p-3 border-b flex justify-between items-center">
      <h3 class="font-semibold text-gray-800">图层管理</h3>
      <span v-if="store.selectedStickerIds.length > 0" class="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
        已选 {{ store.selectedStickerIds.length }}
      </span>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div v-if="sortedStickers.length > 0" class="divide-y">
        <div 
          v-for="sticker in sortedStickers" 
          :key="sticker.id"
          class="flex items-center gap-2 p-2 hover:bg-gray-50 transition-colors cursor-pointer"
          :class="{ 'bg-blue-50': isSelected(sticker.id) }"
          @click="handleSelect(sticker.id)"
          data-test="sticker-item"
        >
          <div class="w-10 h-10 flex items-center justify-center bg-gray-100 rounded overflow-hidden flex-shrink-0">
            <img 
              v-if="sticker.type === 'image'" 
              :src="sticker.src" 
              class="max-w-full max-h-full object-contain"
            />
            <div 
              v-else 
              class="w-8 h-8"
              v-html="sticker.src"
            ></div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-700 truncate">{{ formatName(sticker.name, sticker.type) }}</p>
            <p class="text-xs text-gray-400">层级: {{ sticker.zIndex }}</p>
          </div>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center h-40 text-gray-400">
        <svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
        <p class="text-sm">暂无贴纸</p>
        <p class="text-xs text-gray-400 mt-1">从左侧面板添加贴纸</p>
      </div>
    </div>
  </div>
</template>
