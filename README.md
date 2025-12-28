# Mipa Draw

一个基于 Vue 3 + TypeScript 的画板应用，支持贴纸拖拽、图层管理、背景设置、导出分享等功能。

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Vue 3 (Composition API) |
| 语言 | TypeScript |
| 构建工具 | Vite |
| 状态管理 | Pinia |
| 样式方案 | TailwindCSS |
| 工具库 | @vueuse/core、html2canvas |
| 测试框架 | Vitest |

## 核心功能

| 模块 | 功能描述 |
|------|----------|
| 画布 | 贴纸拖拽添加、移动、缩放、旋转 |
| 图层管理 | 图层列表显示、层级调整、显示/隐藏 |
| 贴纸面板 | 预设贴纸库、图片/SVG 上传 |
| 背景设置 | 纯色、渐变、图片背景切换 |
| 网格系统 | 可配置网格线辅助对齐 |
| 导出功能 | PNG 图片、SVG 矢量图导出 |
| 历史记录 | 撤销/重做操作 |
| 右键菜单 | 快捷操作入口 |

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+Z | 撤销 |
| Ctrl+Y | 重做 |
| Delete | 删除选中 |
| Backspace | 删除选中 |
| Ctrl+A | 全选 |
| Ctrl+D | 复制选中 |
| Esc | 取消选择 |

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
├── components/           # Vue 组件
│   ├── App.vue           # 根组件
│   ├── CanvasBoard.vue   # 画布核心组件（贴纸渲染、交互）
│   ├── Toolbar.vue       # 工具栏（撤销、重做、背景、导出）
│   ├── StickerPanel.vue  # 贴纸面板（预设贴纸、上传）
│   ├── LayerManager.vue  # 图层管理器
│   └── ContextMenu.vue   # 右键菜单
├── stores/               # Pinia 状态管理
│   └── canvas.ts         # 画布状态（贴纸、历史记录、设置）
├── types/                # TypeScript 类型定义
│   └── index.ts          # Sticker、CanvasSettings 等接口
├── main.ts               # 应用入口
└── style.css             # 全局样式
```

## 组件说明

### CanvasBoard
画布核心组件，负责贴纸的渲染和交互处理。
- 支持贴纸选择、拖拽、移动
- 支持缩放（8方向）和旋转
- 支持框选多选
- 显示/隐藏网格
- 响应式背景设置

### Toolbar
顶部工具栏，提供全局操作入口。
- 撤销/重做按钮
- 画布尺寸设置
- 背景设置面板
- 网格开关及配置
- 导出 PNG/SVG
- 打印功能
- 清空画布

### StickerPanel
左侧贴纸面板，提供贴纸素材。
- 预设 SVG 贴纸（表情、星星、爱心、花朵、云朵、蝴蝶）
- 自定义图片/SVG 上传
- 拖拽添加到画布
- 点击直接添加

### LayerManager
右侧图层管理面板。
- 图层列表显示（按层级排序）
- 点击选择图层
- 删除、复制图层
- 置顶/置底、上下移动

### ContextMenu
右键菜单组件。
- 画布右键：粘贴（预留）
- 贴纸右键：选择、复制、删除、层级操作

## 状态管理 (canvas store)

### 核心状态
```typescript
settings: CanvasSettings    // 画布尺寸、背景、网格设置
stickers: Sticker[]         // 所有贴纸列表
selectedStickerIds: string[] // 选中的贴纸 ID 列表
history: HistoryState[]     // 历史记录
```

### 核心方法
| 方法 | 功能 |
|------|------|
| addSticker() | 添加贴纸 |
| removeSticker() | 删除贴纸 |
| updateSticker() | 更新贴纸属性 |
| selectSticker() | 选择贴纸 |
| undo()/redo() | 撤销/重做 |
| bringToFront() | 置顶 |
| sendToBack() | 置底 |
| duplicateSticker() | 复制贴纸 |
| clearCanvas() | 清空画布 |

## 依赖版本

- Node.js >= 18
- Vue 3.5+
- TypeScript 5.9+
- Vite 7.x
- Pinia 3.x
- TailwindCSS 3.4+

## 浏览器支持

支持所有现代浏览器（Chrome、Firefox、Safari、Edge）的最新版本。
