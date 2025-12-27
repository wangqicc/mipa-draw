<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'

const store = useCanvasStore()
const selectedSticker = computed(() => store.selectedSticker)
const selectedStickers = computed(() => store.selectedStickers)
const isMultiSelect = computed(() => store.selectedStickerIds.length > 1)

function handleDelete() {
  if (isMultiSelect.value) {
    store.removeSelectedStickers()
  } else if (selectedSticker.value) {
    store.removeSticker(selectedSticker.value.id)
  }
}

function handleDuplicate() {
  if (isMultiSelect.value) {
    store.duplicateSelectedStickers()
  } else if (selectedSticker.value) {
    store.duplicateSticker(selectedSticker.value.id)
  }
}

function handleBringToFront() {
  if (isMultiSelect.value) {
    store.bringSelectedToFront()
  } else if (selectedSticker.value) {
    store.bringToFront(selectedSticker.value.id)
  }
}

function handleSendToBack() {
  if (isMultiSelect.value) {
    store.sendSelectedToBack()
  } else if (selectedSticker.value) {
    store.sendToBack(selectedSticker.value.id)
  }
}

function handleMoveUp() {
  if (isMultiSelect.value) {
    store.moveSelectedUp()
  } else if (selectedSticker.value) {
    store.moveUp(selectedSticker.value.id)
  }
}

function handleMoveDown() {
  if (isMultiSelect.value) {
    store.moveSelectedDown()
  } else if (selectedSticker.value) {
    store.moveDown(selectedSticker.value.id)
  }
}

function updateX(e: Event) {
  const value = parseFloat((e.target as HTMLInputElement).value)
  if (selectedSticker.value && !isNaN(value)) {
    store.updateSticker(selectedSticker.value.id, { x: value })
  }
}

function updateY(e: Event) {
  const value = parseFloat((e.target as HTMLInputElement).value)
  if (selectedSticker.value && !isNaN(value)) {
    store.updateSticker(selectedSticker.value.id, { y: value })
  }
}

function updateWidth(e: Event) {
  const value = parseFloat((e.target as HTMLInputElement).value)
  if (selectedSticker.value && !isNaN(value) && value > 0) {
    store.updateSticker(selectedSticker.value.id, { width: value })
  }
}

function updateHeight(e: Event) {
  const value = parseFloat((e.target as HTMLInputElement).value)
  if (selectedSticker.value && !isNaN(value) && value > 0) {
    store.updateSticker(selectedSticker.value.id, { height: value })
  }
}

function updateRotation(e: Event) {
  const value = parseFloat((e.target as HTMLInputElement).value)
  if (selectedSticker.value && !isNaN(value)) {
    store.updateSticker(selectedSticker.value.id, { rotation: value })
  }
}
</script>

<template>
  <div class="flex flex-col h-full bg-white rounded-lg shadow">
    <div class="p-3 border-b">
      <h3 class="font-semibold text-gray-800">属性面板</h3>
    </div>

    <div class="flex-1 overflow-y-auto p-3">
      <div v-if="isMultiSelect">
        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">多选信息</h4>
          <div class="bg-blue-50 rounded p-3">
            <p class="text-sm text-blue-700">已选择 {{ store.selectedStickerIds.length }} 个贴纸</p>
          </div>
        </div>

        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">批量操作</h4>
          <div class="grid grid-cols-2 gap-2">
            <button 
              class="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              @click="handleMoveUp"
            >
              上移一层
            </button>
            <button 
              class="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              @click="handleMoveDown"
            >
              下移一层
            </button>
            <button 
              class="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              @click="handleBringToFront"
            >
              置于顶层
            </button>
            <button 
              class="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              @click="handleSendToBack"
            >
              置于底层
            </button>
          </div>
        </div>

        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">操作</h4>
          <div class="flex gap-2">
            <button 
              class="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
              @click="handleDuplicate"
            >
              批量复制
            </button>
            <button 
              class="flex-1 px-3 py-2 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
              @click="handleDelete"
            >
              批量删除
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="selectedSticker">
        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">基本信息</h4>
          <div class="bg-gray-50 rounded p-2">
            <p class="text-sm text-gray-600">名称: {{ selectedSticker.name }}</p>
            <p class="text-sm text-gray-600">类型: {{ selectedSticker.type === 'image' ? '图片' : 'SVG' }}</p>
            <p class="text-sm text-gray-600">层级: {{ selectedSticker.zIndex }}</p>
          </div>
        </div>

        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">位置</h4>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-xs text-gray-500">X</label>
              <input 
                :value="selectedSticker.x"
                type="number"
                class="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                @change="updateX"
              />
            </div>
            <div>
              <label class="text-xs text-gray-500">Y</label>
              <input 
                :value="selectedSticker.y"
                type="number"
                class="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                @change="updateY"
              />
            </div>
          </div>
        </div>

        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">尺寸</h4>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-xs text-gray-500">宽度</label>
              <input 
                :value="selectedSticker.width"
                type="number"
                min="1"
                class="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                @change="updateWidth"
              />
            </div>
            <div>
              <label class="text-xs text-gray-500">高度</label>
              <input 
                :value="selectedSticker.height"
                type="number"
                min="1"
                class="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                @change="updateHeight"
              />
            </div>
          </div>
        </div>

        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">旋转角度</h4>
          <div class="flex items-center gap-2">
            <input 
              :value="selectedSticker.rotation"
              type="range"
              min="-180"
              max="180"
              class="flex-1"
              @input="updateRotation"
            />
            <span class="text-sm text-gray-600 w-14">{{ selectedSticker.rotation }}°</span>
          </div>
        </div>

        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">图层顺序</h4>
          <div class="grid grid-cols-2 gap-2">
            <button 
              class="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              @click="handleMoveUp"
            >
              上移一层
            </button>
            <button 
              class="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              @click="handleMoveDown"
            >
              下移一层
            </button>
            <button 
              class="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              @click="handleBringToFront"
            >
              置于顶层
            </button>
            <button 
              class="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              @click="handleSendToBack"
            >
              置于底层
            </button>
          </div>
        </div>

        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">操作</h4>
          <div class="flex gap-2">
            <button 
              class="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
              @click="handleDuplicate"
            >
              复制
            </button>
            <button 
              class="flex-1 px-3 py-2 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
              @click="handleDelete"
            >
              删除
            </button>
          </div>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center h-40 text-gray-400">
        <svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/>
        </svg>
        <p class="text-sm">选择贴纸以编辑属性</p>
        <p class="text-xs text-gray-400 mt-1">可使用框选多选贴纸</p>
      </div>
    </div>
  </div>
</template>
