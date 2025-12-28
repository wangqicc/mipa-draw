import { describe, it, expect } from 'vitest'
import type { Sticker, CanvasSettings, HistoryState, BackgroundOption } from '@/types'

describe('类型定义', () => {
  describe('Sticker接口', () => {
    it('应该正确实现Sticker接口', () => {
      const sticker: Sticker = {
        id: 'test-1',
        type: 'image',
        src: 'test.jpg',
        x: 100,
        y: 100,
        width: 50,
        height: 50,
        rotation: 0,
        zIndex: 1,
        name: '测试贴纸'
      }

      expect(sticker).toBeDefined()
      expect(typeof sticker.id).toBe('string')
      expect(sticker.type).toBe('image')
      expect(typeof sticker.x).toBe('number')
      expect(typeof sticker.y).toBe('number')
      expect(typeof sticker.width).toBe('number')
      expect(typeof sticker.height).toBe('number')
      expect(typeof sticker.rotation).toBe('number')
      expect(typeof sticker.zIndex).toBe('number')
      expect(typeof sticker.name).toBe('string')
    })

    it('应该支持SVG类型贴纸', () => {
      const svgSticker: Sticker = {
        id: 'svg-1',
        type: 'svg',
        src: 'icon.svg',
        x: 50,
        y: 50,
        width: 30,
        height: 30,
        rotation: 45,
        zIndex: 2,
        name: 'SVG图标'
      }

      expect(svgSticker.type).toBe('svg')
      expect(svgSticker.rotation).toBe(45)
    })
  })

  describe('CanvasSettings接口', () => {
    it('应该正确实现CanvasSettings接口', () => {
      const settings: CanvasSettings = {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff',
        backgroundGradient: 'linear-gradient(45deg, #ff0000, #00ff00)',
        backgroundImage: 'background.jpg',
        showGrid: true,
        gridSize: 20,
        gridColor: '#e5e7eb',

      }

      expect(settings).toBeDefined()
      expect(typeof settings.width).toBe('number')
      expect(typeof settings.height).toBe('number')
      expect(typeof settings.backgroundColor).toBe('string')
      expect(typeof settings.backgroundGradient).toBe('string')
      expect(typeof settings.backgroundImage).toBe('string')
      expect(typeof settings.showGrid).toBe('boolean')
      expect(typeof settings.gridSize).toBe('number')
      expect(typeof settings.gridColor).toBe('string')

    })

    it('应该支持可选的背景设置', () => {
      const minimalSettings: CanvasSettings = {
        width: 400,
        height: 300,
        backgroundColor: '#000000',
        showGrid: false,
        gridSize: 10,
        gridColor: '#ffffff',

      }

      expect(minimalSettings.backgroundGradient).toBeUndefined()
      expect(minimalSettings.backgroundImage).toBeUndefined()
    })
  })

  describe('HistoryState接口', () => {
    it('应该正确实现HistoryState接口', () => {
      const stickers: Sticker[] = [
        {
          id: 'test-1',
          type: 'image',
          src: 'test1.jpg',
          x: 100,
          y: 100,
          width: 50,
          height: 50,
          rotation: 0,
          zIndex: 1,
          name: '贴纸1'
        }
      ]

      const historyState: HistoryState = {
        stickers,
        timestamp: Date.now()
      }

      expect(historyState).toBeDefined()
      expect(Array.isArray(historyState.stickers)).toBe(true)
      expect(typeof historyState.timestamp).toBe('number')
      expect(historyState.stickers).toHaveLength(1)
    })
  })

  describe('BackgroundOption接口', () => {
    it('应该正确实现BackgroundOption接口', () => {
      const solidBackground: BackgroundOption = {
        type: 'solid',
        value: '#ff0000',
        name: '红色背景'
      }

      const gradientBackground: BackgroundOption = {
        type: 'gradient',
        value: 'linear-gradient(45deg, #ff0000, #00ff00)',
        name: '渐变背景'
      }

      const imageBackground: BackgroundOption = {
        type: 'image',
        value: 'background.jpg',
        name: '图片背景'
      }

      expect(solidBackground.type).toBe('solid')
      expect(gradientBackground.type).toBe('gradient')
      expect(imageBackground.type).toBe('image')

      expect(typeof solidBackground.value).toBe('string')
      expect(typeof gradientBackground.value).toBe('string')
      expect(typeof imageBackground.value).toBe('string')

      expect(typeof solidBackground.name).toBe('string')
      expect(typeof gradientBackground.name).toBe('string')
      expect(typeof imageBackground.name).toBe('string')
    })
  })

  describe('类型约束', () => {
    it('应该只允许有效的贴纸类型', () => {
      // 测试有效的类型
      const validTypes: Array<'image' | 'svg'> = ['image', 'svg']

      validTypes.forEach(type => {
        const sticker: Sticker = {
          id: 'test',
          type,
          src: 'test.jpg',
          x: 0,
          y: 0,
          width: 10,
          height: 10,
          rotation: 0,
          zIndex: 1,
          name: '测试'
        }
        expect(sticker.type).toBe(type)
      })
    })

    it('应该只允许有效的背景类型', () => {
      const validTypes: Array<'solid' | 'gradient' | 'image'> = ['solid', 'gradient', 'image']

      validTypes.forEach(type => {
        const option: BackgroundOption = {
          type,
          value: 'test',
          name: '测试'
        }
        expect(option.type).toBe(type)
      })
    })
  })
})