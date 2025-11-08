# 贝塞尔曲线模拟器 (Bezier Curve Simulator)

一个基于 Vue 3 和 Nuxt 3 的交互式贝塞尔曲线编辑器，支持实时拖拽调整和曲线平滑功能。

![Bezier Curve Simulator](public/nuxt.svg)

## ✨ 特性

- 🎯 **交互式编辑**: 通过拖拽蓝色控制点实时调整贝塞尔曲线
- 🔄 **曲线平滑**: 一键平滑功能，自动优化曲线形状
- 📊 **数据可视化**: 完整的坐标轴和刻度显示
- 🌓 **暗色主题**: 支持深色模式界面
- 📱 **响应式设计**: 适配各种屏幕尺寸
- ⚡ **高性能**: 基于 Vue 3 Composition API 和现代前端技术

## 🛠️ 技术栈

- **框架**: [Nuxt 3](https://nuxt.com/) + [Vue 3](https://vuejs.org/)
- **状态管理**: [Pinia](https://pinia.vuejs.org/)
- **样式**: [UnoCSS](https://unocss.dev/)
- **图标**: [Iconify](https://iconify.design/)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **包管理**: [pnpm](https://pnpm.io/)
- **代码规范**: [ESLint](https://eslint.org/) + [@antfu/eslint-config](https://github.com/antfu/eslint-config)

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

访问 `http://localhost:3000` 查看应用

### 构建生产版本

```bash
pnpm build
```

### 预览生产版本

```bash
pnpm preview
```

## 📖 使用说明

1. **拖拽控制点**: 拖拽图中的蓝色控制点来调整曲线的形状
2. **重置控制点**: 双击任意控制点将其重置到默认位置
3. **平滑曲线**: 点击"一键平滑曲线"按钮自动优化曲线
4. **查看数据**: 坐标轴显示时间(s)和距离(km)刻度

## 📁 项目结构

```
├── app/                    # 应用源码
│   ├── components/         # Vue 组件
│   │   ├── BezierCurveSimulator.vue  # 主要的曲线编辑器组件
│   │   ├── DarkToggle.vue            # 深色模式切换
│   │   ├── Footer.vue               # 页脚组件
│   │   └── PlaybackChart.vue        # 播放图表组件
│   ├── constants/         # 公共常量配置
│   ├── layouts/           # Nuxt 布局
│   ├── pages/             # 页面组件
│   ├── stores/            # Pinia 状态管理
│   │   └── curve.js       # 曲线状态管理
│   └── utils/             # 工具函数
│       └── bezier.js      # 贝塞尔曲线数学计算
├── public/                # 静态资源
├── nuxt.config.ts         # Nuxt 配置
├── package.json           # 项目依赖
└── README.md             # 项目说明
```

## 🔧 核心算法

### 贝塞尔曲线计算

项目实现了完整的三次贝塞尔曲线数学模型：

- **参数方程**: 使用标准的三次贝塞尔曲线参数方程
- **参数求解**: 通过二分查找算法根据 x 坐标求解参数 t
- **插值计算**: 在复合曲线中精确定位任意时间点对应的高度值

### 主要函数

- `cubicBezier(t, p0, p1, p2, p3)`: 计算三次贝塞尔曲线上任意参数 t 对应的点
- `findTforX(x, p0, p1, p2, p3)`: 根据 x 坐标求解参数 t
- `getHeightAtTime(time, points, controlPoints)`: 获取复合曲线上任意时间对应的高度

## 🎨 功能亮点

- **实时渲染**: SVG 路径动态生成，实时响应用户操作
- **坐标转换**: 实现了数据坐标系与 SVG 坐标系的灵活转换
- **状态管理**: 使用 Pinia 统一管理曲线数据和控制点状态
- **响应式设计**: 组件化架构，良好的代码组织和可维护性

## 📝 许可证

本项目基于 [MIT License](LICENSE) 开源。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

---

**享受编辑贝塞尔曲线的乐趣！** 🎉
