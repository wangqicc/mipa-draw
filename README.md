# Mipa Draw

一个基于 Vue 3 + TypeScript 的画板应用，支持多种绘图工具、图层管理、贴纸面板等核心功能。

## 技术栈

- **框架**：Vue 3 (Composition API)
- **语言**：TypeScript
- **构建工具**：Vite
- **状态管理**：Pinia
- **样式方案**：TailwindCSS
- **工具库**：@vueuse/core、html2canvas
- **测试框架**：Vitest

## 核心功能

| 模块 | 功能描述 |
|------|----------|
| 画布 | 自由绘制、多形状绘制、橡皮擦、撤销/重做 |
| 图层管理 | 图层列表显示、图层顺序调整、显示/隐藏控制 |
| 属性面板 | 颜色、线宽、透明度等属性配置 |
| 贴纸面板 | 内置贴纸素材，快速添加到画布 |
| 工具栏 | 画笔、形状、橡皮、选择等工具切换 |
| 右键菜单 | 画布右键操作、图层快捷操作 |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm run test
```

## 项目结构

```
src/
├── components/       # 组件
│   ├── CanvasBoard.vue    # 画布核心组件
│   ├── Toolbar.vue        # 工具栏
│   ├── PropertiesPanel.vue # 属性面板
│   ├── LayerManager.vue   # 图层管理器
│   ├── StickerPanel.vue   # 贴纸面板
│   └── ContextMenu.vue    # 右键菜单
├── stores/           # Pinia 状态管理
│   └── canvas.ts     # 画布状态
├── types/            # TypeScript 类型定义
│   └── index.ts
├── App.vue           # 根组件
└── main.ts           # 入口文件
```

## 依赖版本

- Node.js >= 18
- Vue 3.5+
- TypeScript 5.9+
