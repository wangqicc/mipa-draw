# 测试用例文档

## 项目概述

mipa-draw 是一个基于 Vue3 + TypeScript + Pinia 的画板应用，支持贴纸拖拽、图层管理、历史记录等功能。

## 测试框架配置

### 安装的依赖

- **vitest**: 测试运行器
- **@vue/test-utils**: Vue组件测试工具
- **jsdom**: DOM环境模拟
- **@vitest/coverage-v8**: 代码覆盖率工具

### 测试命令

```bash
# 运行所有测试
npm test

# 运行测试并显示UI界面
npm run test:ui

# 运行测试并生成覆盖率报告
npm run test:coverage
```

## 测试用例结构

### 1. 类型定义测试 (`tests/types/index.test.ts`)

验证项目中定义的所有TypeScript接口：

- **Sticker接口**: 验证贴纸对象的属性类型和约束
- **CanvasSettings接口**: 验证画布设置对象的属性
- **HistoryState接口**: 验证历史记录状态结构
- **BackgroundOption接口**: 验证背景选项结构
- **类型约束**: 验证枚举类型的有效性

### 2. Store测试 (`tests/stores/canvas.test.ts`)

测试Pinia store的核心功能：

#### 初始状态测试
- 验证画布默认设置（尺寸、背景色、网格等）
- 验证初始状态（空贴纸数组、选择状态等）

#### 贴纸管理测试
- 添加贴纸功能
- 删除贴纸功能
- 更新贴纸属性
- 复制贴纸功能
- 批量删除选中贴纸
- 批量复制选中贴纸

#### 选择管理测试
- 单个贴纸选择
- 清除选择
- 切换选择状态
- 添加到选择
- 批量选择管理

#### 图层管理测试
- 置顶功能
- 置底功能
- 上移一层
- 下移一层
- 批量图层操作

#### 历史记录测试
- 保存历史记录
- 撤销操作
- 重做操作
- 历史记录数量限制

#### 画布设置测试
- 缩放功能
- 缩放范围限制
- 清空画布

#### 计算属性测试
- 最大z-index计算
- 空状态处理

### 3. 组件测试

#### CanvasBoard组件 (`tests/components/CanvasBoard.test.ts`)
- 组件渲染测试
- 网格线显示
- 背景样式应用
- 贴纸渲染
- 坐标计算
- 鼠标事件处理
- 选择框显示
- 响应式更新
- 拖拽状态管理
- 窗口大小变化处理
- 事件监听器清理

#### Toolbar组件 (`tests/components/Toolbar.test.ts`)
- 工具栏渲染
- 工具按钮显示
- 工具选择处理
- 当前选中工具显示
- 响应式更新

#### PropertiesPanel组件 (`tests/components/PropertiesPanel.test.ts`)
- 属性面板渲染
- 属性控件显示
- 属性变更处理
- 选中元素属性显示
- 响应式更新

#### LayerManager组件 (`tests/components/LayerManager.test.ts`)
- 图层管理器渲染
- 图层列表显示
- 图层操作处理
- 图层顺序显示
- 响应式更新

#### StickerPanel组件 (`tests/components/StickerPanel.test.ts`)
- 贴纸面板渲染
- 贴纸选项显示
- 贴纸选择处理
- 贴纸预览
- 响应式更新

#### ContextMenu组件 (`tests/components/ContextMenu.test.ts`)
- 上下文菜单渲染
- 菜单选项显示
- 菜单选择处理
- 位置显示
- 响应式更新

#### HelloWorld组件 (`tests/components/HelloWorld.test.ts`)
- 组件渲染
- Props消息显示
- Props响应式更新
- 组件交互处理

### 4. 工具函数测试 (`tests/utils/index.test.ts`)

#### 贴纸边界计算
- 边界计算
- 点是否在贴纸内检测
- 边界点处理

#### 缩放计算
- 缩放比例计算
- 缩放范围限制

#### 颜色转换
- 颜色格式验证
- RGB到HEX转换

#### 坐标转换
- 屏幕坐标到画布坐标
- 画布坐标到屏幕坐标

#### 数学计算
- 两点间距离计算
- 角度计算
- 旋转后坐标计算

#### 数组操作
- 最大z-index查找
- 最小z-index查找
- 空数组处理

### 5. 应用集成测试 (`tests/App.test.ts`)
- 主应用渲染
- 主要组件包含
- Pinia store设置
- 响应式更新

## 测试覆盖率目标

- **语句覆盖率**: >80%
- **分支覆盖率**: >75%
- **函数覆盖率**: >85%
- **行覆盖率**: >80%

## 测试最佳实践

1. **单元测试**: 每个函数和组件独立测试
2. **集成测试**: 测试组件间的交互
3. **边界测试**: 测试异常输入和边界条件
4. **响应式测试**: 验证Vue的响应式系统
5. **类型测试**: 验证TypeScript类型定义

## 运行测试结果

测试用例覆盖了项目的核心功能，包括：

- ✅ 类型定义验证
- ✅ Store状态管理
- ✅ 组件渲染和交互
- ✅ 工具函数逻辑
- ✅ 应用集成

所有测试用例都遵循了Vue3和TypeScript的最佳实践，确保代码质量和可维护性。