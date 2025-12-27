import { describe, it, expect } from 'vitest'
import type { Sticker } from '@/types'

// 工具函数：计算贴纸边界
describe('工具函数 - 贴纸边界计算', () => {
  const mockSticker: Sticker = {
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

  it('应该正确计算贴纸边界', () => {
    const bounds = {
      left: mockSticker.x,
      top: mockSticker.y,
      right: mockSticker.x + mockSticker.width,
      bottom: mockSticker.y + mockSticker.height
    }

    expect(bounds.left).toBe(100)
    expect(bounds.top).toBe(100)
    expect(bounds.right).toBe(150)
    expect(bounds.bottom).toBe(150)
  })

  it('应该检测点是否在贴纸内', () => {
    const point = { x: 120, y: 120 }
    const isInside = point.x >= mockSticker.x && 
                    point.x <= mockSticker.x + mockSticker.width &&
                    point.y >= mockSticker.y && 
                    point.y <= mockSticker.y + mockSticker.height

    expect(isInside).toBe(true)
  })

  it('应该检测点是否在贴纸外', () => {
    const point = { x: 200, y: 200 }
    const isInside = point.x >= mockSticker.x && 
                    point.x <= mockSticker.x + mockSticker.width &&
                    point.y >= mockSticker.y && 
                    point.y <= mockSticker.y + mockSticker.height

    expect(isInside).toBe(false)
  })

  it('应该处理边界点', () => {
    const topLeft = { x: 100, y: 100 }
    const bottomRight = { x: 150, y: 150 }

    const isTopLeftInside = topLeft.x >= mockSticker.x && 
                             topLeft.x <= mockSticker.x + mockSticker.width &&
                             topLeft.y >= mockSticker.y && 
                             topLeft.y <= mockSticker.y + mockSticker.height

    const isBottomRightInside = bottomRight.x >= mockSticker.x && 
                               bottomRight.x <= mockSticker.x + mockSticker.width &&
                               bottomRight.y >= mockSticker.y && 
                               bottomRight.y <= mockSticker.y + mockSticker.height

    expect(isTopLeftInside).toBe(true)
    expect(isBottomRightInside).toBe(true)
  })
})

// 工具函数：计算缩放
describe('工具函数 - 缩放计算', () => {
  it('应该正确计算缩放比例', () => {
    const originalSize = { width: 100, height: 100 }
    const scale = 1.5

    const scaledSize = {
      width: originalSize.width * scale,
      height: originalSize.height * scale
    }

    expect(scaledSize.width).toBe(150)
    expect(scaledSize.height).toBe(150)
  })

  it('应该限制缩放范围', () => {
    const minScale = 0.1
    const maxScale = 3.0

    const clampScale = (scale: number) => Math.max(minScale, Math.min(maxScale, scale))

    expect(clampScale(0.05)).toBe(0.1)
    expect(clampScale(5.0)).toBe(3.0)
    expect(clampScale(1.5)).toBe(1.5)
  })
})

// 工具函数：颜色转换
describe('工具函数 - 颜色转换', () => {
  it('应该验证颜色格式', () => {
    const isValidHexColor = (color: string) => /^#[0-9A-F]{6}$/i.test(color)

    expect(isValidHexColor('#FF0000')).toBe(true)
    expect(isValidHexColor('#ff0000')).toBe(true)
    expect(isValidHexColor('#000000')).toBe(true)
    expect(isValidHexColor('#FFFFFF')).toBe(true)
    expect(isValidHexColor('FF0000')).toBe(false)
    expect(isValidHexColor('#GG0000')).toBe(false)
  })

  it('应该转换RGB到HEX', () => {
    const rgbToHex = (r: number, g: number, b: number) => {
      return '#' + [r, g, b].map(x => {
        const hex = x.toString(16)
        return hex.length === 1 ? '0' + hex : hex
      }).join('').toUpperCase()
    }

    expect(rgbToHex(255, 0, 0)).toBe('#FF0000')
    expect(rgbToHex(0, 255, 0)).toBe('#00FF00')
    expect(rgbToHex(0, 0, 255)).toBe('#0000FF')
    expect(rgbToHex(255, 255, 255)).toBe('#FFFFFF')
  })
})

// 工具函数：坐标转换
describe('工具函数 - 坐标转换', () => {
  it('应该转换屏幕坐标到画布坐标', () => {
    const screenPoint = { x: 500, y: 300 }
    const canvasOffset = { x: 100, y: 50 }
    const zoom = 1.5

    const canvasPoint = {
      x: (screenPoint.x - canvasOffset.x) / zoom,
      y: (screenPoint.y - canvasOffset.y) / zoom
    }

    expect(canvasPoint.x).toBeCloseTo(266.67, 2)
    expect(canvasPoint.y).toBeCloseTo(166.67, 2)
  })

  it('应该转换画布坐标到屏幕坐标', () => {
    const canvasPoint = { x: 200, y: 150 }
    const canvasOffset = { x: 50, y: 25 }
    const zoom = 2.0

    const screenPoint = {
      x: canvasPoint.x * zoom + canvasOffset.x,
      y: canvasPoint.y * zoom + canvasOffset.y
    }

    expect(screenPoint.x).toBe(450)
    expect(screenPoint.y).toBe(325)
  })
})

// 工具函数：数学计算
describe('工具函数 - 数学计算', () => {
  it('应该计算两点间距离', () => {
    const point1 = { x: 0, y: 0 }
    const point2 = { x: 3, y: 4 }

    const distance = Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + 
      Math.pow(point2.y - point1.y, 2)
    )

    expect(distance).toBe(5)
  })

  it('应该计算角度', () => {
    const center = { x: 0, y: 0 }
    const point = { x: 1, y: 1 }

    const angle = Math.atan2(point.y - center.y, point.x - center.x) * 180 / Math.PI

    expect(angle).toBeCloseTo(45, 2)
  })

  it('应该计算旋转后的坐标', () => {
    const point = { x: 10, y: 0 }
    const center = { x: 0, y: 0 }
    const angle = 90 // 度

    const angleRad = angle * Math.PI / 180
    const rotatedX = center.x + (point.x - center.x) * Math.cos(angleRad) - (point.y - center.y) * Math.sin(angleRad)
    const rotatedY = center.y + (point.x - center.x) * Math.sin(angleRad) + (point.y - center.y) * Math.cos(angleRad)

    expect(rotatedX).toBeCloseTo(0, 10)
    expect(rotatedY).toBeCloseTo(10, 10)
  })
})

// 工具函数：数组操作
describe('工具函数 - 数组操作', () => {
  it('应该查找数组中的最大z-index', () => {
    const stickers: Sticker[] = [
      { id: '1', type: 'image', src: '1.jpg', x: 0, y: 0, width: 10, height: 10, rotation: 0, zIndex: 1, name: '1' },
      { id: '2', type: 'image', src: '2.jpg', x: 0, y: 0, width: 10, height: 10, rotation: 0, zIndex: 5, name: '2' },
      { id: '3', type: 'image', src: '3.jpg', x: 0, y: 0, width: 10, height: 10, rotation: 0, zIndex: 3, name: '3' }
    ]

    const maxZIndex = Math.max(...stickers.map(s => s.zIndex))

    expect(maxZIndex).toBe(5)
  })

  it('应该查找数组中的最小z-index', () => {
    const stickers: Sticker[] = [
      { id: '1', type: 'image', src: '1.jpg', x: 0, y: 0, width: 10, height: 10, rotation: 0, zIndex: 5, name: '1' },
      { id: '2', type: 'image', src: '2.jpg', x: 0, y: 0, width: 10, height: 10, rotation: 0, zIndex: 1, name: '2' },
      { id: '3', type: 'image', src: '3.jpg', x: 0, y: 0, width: 10, height: 10, rotation: 0, zIndex: 3, name: '3' }
    ]

    const minZIndex = Math.min(...stickers.map(s => s.zIndex))

    expect(minZIndex).toBe(1)
  })

  it('应该处理空数组', () => {
    const stickers: Sticker[] = []

    const maxZIndex = stickers.length > 0 ? Math.max(...stickers.map(s => s.zIndex)) : 0
    const minZIndex = stickers.length > 0 ? Math.min(...stickers.map(s => s.zIndex)) : 0

    expect(maxZIndex).toBe(0)
    expect(minZIndex).toBe(0)
  })
})