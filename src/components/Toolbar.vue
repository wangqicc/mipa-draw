<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCanvasStore } from '@/stores/canvas'
import html2canvas from 'html2canvas'

const store = useCanvasStore()

function triggerFileInput() {
  const fileInput = document.querySelector('.bg-settings-input') as HTMLInputElement
  fileInput?.click()
}

const backgroundTypes = [
  { name: '纯色', value: 'solid' },
  { name: '渐变', value: 'gradient' },
  { name: '图片', value: 'image' }
]

const solidColors = [
  '#ffffff', '#f3f4f6', '#e5e7eb', '#d1d5db',
  '#9ca3af', '#374151', '#000000',
  '#fef2f2', '#fee2e2', '#fecaca',
  '#fff7ed', '#ffedd5', '#fed7aa',
  '#fefce8', '#fef9c3', '#fef08a',
  '#f0fdf4', '#dcfce7', '#bbf7d0',
  '#eff6ff', '#dbeafe', '#bfdbfe',
  '#f5f3ff', '#ede9fe', '#ddd6fe',
  '#fdf2f8', '#fce7f3', '#fbcfe8',
  '#fff1f2', '#ffe4e6', '#fecdd3'
]

const gradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
]

const showSizeModal = ref(false)
const showExportModal = ref(false)
const showBackgroundPanel = ref(false)

const canvasWidth = ref(store.settings.width)
const canvasHeight = ref(store.settings.height)

function applySize() {
  store.settings.width = canvasWidth.value
  store.settings.height = canvasHeight.value
  showSizeModal.value = false
}

async function exportAsImage() {
  const canvasElement = document.querySelector('.canvas-shadow') as HTMLElement
  if (!canvasElement) return

  try {
    const canvas = await html2canvas(canvasElement, {
      backgroundColor: null,
      scale: 2
    })

    const link = document.createElement('a')
    link.download = `canvas-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (error) {
    console.error('导出失败:', error)
  }
  showExportModal.value = false
}

function exportAsSVG() {
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${store.settings.width}" height="${store.settings.height}">
  <defs>
    ${store.settings.backgroundGradient ? `<linearGradient id="bg">${store.settings.backgroundGradient}</linearGradient>` : ''}
  </defs>
  <rect width="100%" height="100%" fill="${store.settings.backgroundColor}"/>
  ${store.settings.showGrid ? generateGridSVG() : ''}
  ${store.stickers.map(s => generateStickerSVG(s)).join('')}
</svg>`

  const blob = new Blob([svgContent], { type: 'image/svg+xml' })
  const link = document.createElement('a')
  link.download = `canvas-${Date.now()}.svg`
  link.href = URL.createObjectURL(blob)
  link.click()
}

function generateGridSVG() {
  let gridLines = ''
  for (let x = 0; x <= store.settings.width; x += store.settings.gridSize) {
    gridLines += `<line x1="${x}" y1="0" x2="${x}" y2="${store.settings.height}" stroke="${store.settings.gridColor}" stroke-width="1"/>`
  }
  for (let y = 0; y <= store.settings.height; y += store.settings.gridSize) {
    gridLines += `<line x1="0" y1="${y}" x2="${store.settings.width}" y2="${y}" stroke="${store.settings.gridColor}" stroke-width="1"/>`
  }
  return gridLines
}

function generateStickerSVG(sticker: { type: string; src: string; x: number; y: number; width: number; height: number; rotation: number }) {
  if (sticker.type === 'image') {
    return `<image href="${sticker.src}" x="${sticker.x}" y="${sticker.y}" width="${sticker.width}" height="${sticker.height}" transform="rotate(${sticker.rotation} ${sticker.x + sticker.width/2} ${sticker.y + sticker.height/2})"/>`
  }
  return `<g transform="translate(${sticker.x}, ${sticker.y}) rotate(${sticker.rotation})">${sticker.src.replace(/<svg[^>]*>|<\/svg>/g, '')}</g>`
}

function handlePrint() {
  window.print()
}

function handleBackgroundImageUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    store.settings.backgroundImage = event.target?.result as string
  }
  reader.readAsDataURL(file)
}


</script>

<template>
  <div class="flex items-center gap-2 p-2 bg-white border-b shadow-sm no-print">
    <div class="flex items-center gap-1 px-2 border-r">
      <button 
        class="p-2 rounded hover:bg-gray-100 transition-colors"
        title="撤销 (Ctrl+Z)"
        @click="store.undo()"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
        </svg>
      </button>
      <button 
        class="p-2 rounded hover:bg-gray-100 transition-colors"
        title="重做 (Ctrl+Y)"
        @click="store.redo()"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"/>
        </svg>
      </button>
    </div>



    <div class="flex items-center gap-1 px-2 border-r">
      <button 
        class="flex items-center gap-1 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors text-sm"
        @click="showSizeModal = true"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
        </svg>
        画布尺寸
      </button>
      <button 
        class="flex items-center gap-1 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors text-sm"
        @click="showBackgroundPanel = !showBackgroundPanel"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
        </svg>
        背景设置
      </button>
    </div>

    <div class="flex items-center gap-1 px-2 border-r">
      <button 
        class="flex items-center gap-1 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors text-sm"
        :class="{ 'bg-blue-100 text-blue-600': store.settings.showGrid }"
        @click="store.settings.showGrid = !store.settings.showGrid"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
        </svg>
        网格
      </button>
    </div>

    <div class="flex items-center gap-1 px-2">
      <button 
        class="flex items-center gap-1 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors text-sm"
        @click="showExportModal = true"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        导出
      </button>
      <button 
        class="flex items-center gap-1 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors text-sm"
        @click="handlePrint"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
        </svg>
        打印
      </button>
      <button 
        class="flex items-center gap-1 px-3 py-1.5 rounded hover:bg-red-100 transition-colors text-sm text-red-600"
        @click="store.clearCanvas()"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        清空
      </button>
    </div>

    <div v-if="showSizeModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-80">
        <h3 class="text-lg font-semibold mb-4">设置画布尺寸</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm text-gray-600 mb-1">宽度 (px)</label>
            <input 
              v-model.number="canvasWidth" 
              type="number" 
              min="100"
              max="5000"
              class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">高度 (px)</label>
            <input 
              v-model.number="canvasHeight" 
              type="number" 
              min="100"
              max="5000"
              class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex gap-2 pt-2">
            <button 
              class="flex-1 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              @click="showSizeModal = false"
            >
              取消
            </button>
            <button 
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              @click="applySize"
            >
              应用
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showExportModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-80">
        <h3 class="text-lg font-semibold mb-4">导出画布</h3>
        <div class="space-y-3">
          <button 
            class="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            @click="exportAsImage"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            导出为 PNG 图片
          </button>
          <button 
            class="w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            @click="exportAsSVG"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            导出为 SVG 矢量图
          </button>
          <button 
            class="w-full px-4 py-3 bg-gray-100 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            @click="handlePrint"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
            </svg>
            打印
          </button>
          <button 
            class="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            @click="showExportModal = false"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <div v-if="showBackgroundPanel" class="fixed inset-y-0 right-0 w-80 bg-white shadow-xl z-40 overflow-y-auto">
      <div class="p-4 border-b flex justify-between items-center">
        <h3 class="font-semibold">背景设置</h3>
        <button class="p-1 hover:bg-gray-100 rounded" @click="showBackgroundPanel = false">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="p-4 space-y-6">
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">纯色背景</h4>
          <div class="grid grid-cols-6 gap-1">
            <button 
              v-for="color in solidColors" 
              :key="color"
              class="w-8 h-8 rounded border-2 transition-transform hover:scale-110"
              :style="{ backgroundColor: color }"
              :class="{ 'border-blue-500 ring-2 ring-blue-200': store.settings.backgroundColor === color && !store.settings.backgroundGradient && !store.settings.backgroundImage }"
              @click="store.settings.backgroundColor = color; store.settings.backgroundGradient = undefined; store.settings.backgroundImage = undefined"
            ></button>
          </div>
        </div>

        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">渐变背景</h4>
          <div class="grid grid-cols-2 gap-2">
            <button 
              v-for="(gradient, index) in gradients" 
              :key="index"
              class="h-12 rounded border-2 transition-transform hover:scale-105"
              :style="{ background: gradient }"
              :class="{ 'border-blue-500 ring-2 ring-blue-200': store.settings.backgroundGradient === gradient }"
              @click="store.settings.backgroundGradient = gradient; store.settings.backgroundImage = undefined"
            ></button>
          </div>
        </div>

        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">图片背景</h4>
          <input 
            type="file" 
            accept="image/*"
            class="hidden bg-settings-input"
            @change="handleBackgroundImageUpload"
          />
          <button 
            class="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded hover:border-blue-400 hover:bg-blue-50 transition-colors text-sm"
            @click="triggerFileInput"
          >
            选择图片作为背景
          </button>
          <button 
            v-if="store.settings.backgroundImage"
            class="mt-2 w-full px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors text-sm"
            @click="store.settings.backgroundImage = undefined"
          >
            清除图片背景
          </button>
        </div>

        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">网格设置</h4>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">显示网格</span>
              <button 
                class="relative w-10 h-5 rounded-full transition-colors"
                :class="store.settings.showGrid ? 'bg-blue-600' : 'bg-gray-300'"
                @click="store.settings.showGrid = !store.settings.showGrid"
              >
                <span 
                  class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform"
                  :class="{ 'translate-x-5': store.settings.showGrid }"
                ></span>
              </button>
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">网格间距</label>
              <input 
                v-model.number="store.settings.gridSize" 
                type="range" 
                min="10" 
                max="100" 
                step="5"
                class="w-full"
              />
              <span class="text-xs text-gray-500">{{ store.settings.gridSize }}px</span>
            </div>
            <div>
              <label class="block text-sm text-gray-600 mb-1">网格颜色</label>
              <input 
                v-model="store.settings.gridColor" 
                type="color" 
                class="w-full h-8 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
