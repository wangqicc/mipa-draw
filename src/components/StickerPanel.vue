<script setup lang="ts">
import { ref } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import type { Sticker } from '@/types'

const store = useCanvasStore()
const activeTab = ref<'default' | 'upload'>('default')
const fileInput = ref<HTMLInputElement | null>(null)

const defaultStickers = ref<{ id: string; type: 'image' | 'svg'; src: string; name: string }[]>([
  { id: 'emoji-1', type: 'svg', src: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#FFD93D"/><circle cx="35" cy="40" r="5" fill="#333"/><circle cx="65" cy="40" r="5" fill="#333"/><path d="M30 65 Q50 85 70 65" stroke="#333" stroke-width="3" fill="none"/></svg>', name: '笑脸' },
  { id: 'emoji-2', type: 'svg', src: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#6BCB77"/><circle cx="35" cy="40" r="5" fill="#333"/><circle cx="65" cy="40" r="5" fill="#333"/><path d="M30 70 Q50 55 70 70" stroke="#333" stroke-width="3" fill="none"/></svg>', name: '开心' },
  { id: 'emoji-3', type: 'svg', src: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#4D96FF"/><circle cx="35" cy="40" r="5" fill="#333"/><circle cx="65" cy="40" r="5" fill="#333"/><line x1="30" y1="70" x2="70" y2="70" stroke="#333" stroke-width="3"/></svg>', name: '平淡' },
  { id: 'emoji-4', type: 'svg', src: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#FF6B6B"/><circle cx="35" cy="40" r="5" fill="#333"/><circle cx="65" cy="40" r="5" fill="#333"/><path d="M30 75 Q50 60 70 75" stroke="#333" stroke-width="3" fill="none"/></svg>', name: '惊讶' },
  { id: 'emoji-5', type: 'svg', src: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#C9B1FF"/><circle cx="35" cy="40" r="5" fill="#333"/><circle cx="65" cy="40" r="5" fill="#333"/><path d="M30 70 Q50 80 70 70" stroke="#333" stroke-width="3" fill="none"/></svg>', name: '眨眼' },
  { id: 'star-1', type: 'svg', src: '<svg viewBox="0 0 100 100"><polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill="#FFD700" stroke="#FFA500" stroke-width="2"/></svg>', name: '金星' },
  { id: 'star-2', type: 'svg', src: '<svg viewBox="0 0 100 100"><polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill="#C0C0C0" stroke="#A0A0A0" stroke-width="2"/></svg>', name: '银星' },
  { id: 'heart-1', type: 'svg', src: '<svg viewBox="0 0 100 100"><path d="M50 90 C20 60 10 40 25 25 C40 10 50 25 50 25 C50 25 60 10 75 25 C90 40 80 60 50 90" fill="#FF6B6B"/></svg>', name: '爱心' },
  { id: 'heart-2', type: 'svg', src: '<svg viewBox="0 0 100 100"><path d="M50 90 C20 60 10 40 25 25 C40 10 50 25 50 25 C50 25 60 10 75 25 C90 40 80 60 50 90" fill="#FF69B4"/></svg>', name: '粉心' },
  { id: 'flower-1', type: 'svg', src: '<svg viewBox="0 0 100 100"><circle cx="50" cy="25" r="15" fill="#FF6B6B"/><circle cx="75" cy="40" r="15" fill="#FF6B6B"/><circle cx="75" cy="65" r="15" fill="#FF6B6B"/><circle cx="50" cy="80" r="15" fill="#FF6B6B"/><circle cx="25" cy="65" r="15" fill="#FF6B6B"/><circle cx="25" cy="40" r="15" fill="#FF6B6B"/><circle cx="50" cy="50" r="12" fill="#FFD93D"/></svg>', name: '花朵' },
  { id: 'cloud-1', type: 'svg', src: '<svg viewBox="0 0 100 60"><ellipse cx="50" cy="35" rx="45" ry="25" fill="#87CEEB"/><ellipse cx="30" cy="40" rx="20" ry="15" fill="#87CEEB"/><ellipse cx="70" cy="40" rx="20" ry="15" fill="#87CEEB"/></svg>', name: '云朵' },
  { id: 'butterfly-1', type: 'svg', src: '<svg viewBox="0 0 100 100"><ellipse cx="30" cy="40" rx="15" ry="25" fill="#FF69B4" transform="rotate(-20 30 40)"/><ellipse cx="70" cy="40" rx="15" ry="25" fill="#FF69B4" transform="rotate(20 70 40)"/><ellipse cx="30" cy="70" rx="12" ry="20" fill="#FFB6C1" transform="rotate(-10 30 70)"/><ellipse cx="70" cy="70" rx="12" ry="20" fill="#FFB6C1" transform="rotate(10 70 70)"/><rect x="47" y="20" width="6" height="60" rx="3" fill="#333"/></svg>', name: '蝴蝶' }
])

const uploadedStickers = ref<{ id: string; type: 'image' | 'svg'; src: string; name: string }[]>([])

function handleDragStart(e: DragEvent, sticker: { id: string; type: 'image' | 'svg'; src: string; name: string }) {
  e.dataTransfer?.setData('sticker', JSON.stringify(sticker))
}

function addStickerToCanvas(sticker: { id: string; type: 'image' | 'svg'; src: string; name: string }) {
  const newSticker: Sticker = {
    id: crypto.randomUUID(),
    type: sticker.type,
    src: sticker.src,
    x: 50,
    y: 50,
    width: 100,
    height: 100,
    rotation: 0,
    zIndex: store.maxZIndex + 1,
    name: sticker.name
  }
  store.addSticker(newSticker)
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (!files) return

  for (const file of files) {
    const reader = new FileReader()
    reader.onload = (event) => {
      const src = event.target?.result as string
      const isSvg = file.type.includes('svg') || file.name.endsWith('.svg')
      const newSticker = {
        id: crypto.randomUUID(),
        type: (isSvg ? 'svg' : 'image') as 'image' | 'svg',
        src,
        name: file.name.replace(/\.[^/.]+$/, '')
      }
      uploadedStickers.value.push(newSticker)
      addStickerToCanvas(newSticker)
    }
    reader.readAsDataURL(file)
  }
  input.value = ''
}

function removeUploadedSticker(id: string) {
  const index = uploadedStickers.value.findIndex(s => s.id === id)
  if (index !== -1) {
    uploadedStickers.value.splice(index, 1)
  }
}
</script>

<template>
  <div class="flex flex-col h-full bg-white rounded-lg shadow">
    <div class="flex border-b">
      <button 
        class="flex-1 px-4 py-2 text-sm font-medium transition-colors"
        :class="activeTab === 'default' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'"
        @click="activeTab = 'default'"
      >
        预设贴纸
      </button>
      <button 
        class="flex-1 px-4 py-2 text-sm font-medium transition-colors"
        :class="activeTab === 'upload' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'"
        @click="activeTab = 'upload'"
      >
        自定义上传
      </button>
    </div>

    <div v-if="activeTab === 'default'" class="flex-1 overflow-y-auto p-3">
      <div class="grid grid-cols-3 gap-2">
        <div
          v-for="sticker in defaultStickers"
          :key="sticker.id"
          class="aspect-square p-2 border border-gray-200 rounded cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center"
          draggable="true"
          @dragstart="(e) => handleDragStart(e, sticker)"
          @click="addStickerToCanvas(sticker)"
        >
          <template v-if="sticker.type === 'image'">
            <img 
              :src="sticker.src" 
              :alt="sticker.name"
              class="max-w-full max-h-full object-contain"
            />
          </template>
          <template v-else>
            <div 
              class="w-full h-full flex items-center justify-center"
              v-html="sticker.src"
            ></div>
          </template>
        </div>
      </div>
    </div>

    <div v-else class="flex-1 overflow-y-auto p-3">
      <div 
        class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors mb-3"
        @click="fileInput?.click()"
      >
        <input 
          ref="fileInput"
          type="file" 
          accept="image/*,.svg" 
          multiple 
          class="hidden"
          @change="handleFileSelect"
        />
        <div class="text-3xl mb-1">📁</div>
        <p class="text-sm text-gray-600">点击或拖拽文件到此处</p>
        <p class="text-xs text-gray-400">支持 PNG、JPG、SVG 格式</p>
      </div>

      <div v-if="uploadedStickers.length > 0" class="space-y-2">
        <div 
          v-for="sticker in uploadedStickers"
          :key="sticker.id"
          class="flex items-center gap-2 p-2 border border-gray-200 rounded group"
        >
          <div class="w-10 h-10 flex items-center justify-center bg-gray-100 rounded">
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
          <span class="flex-1 text-sm text-gray-700 truncate">{{ sticker.name }}</span>
          <button 
            class="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            @click="removeUploadedSticker(sticker.id)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
