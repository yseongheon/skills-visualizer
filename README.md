# Skills RAG 过程可视化平台

基于 Vue 3 + Vite + Element Plus 开发的 ReqTrans Skills RAG 过程可视化平台，用于展示 RAG（检索增强生成）的完整流程。

## 项目特点

### 🎯 核心功能
1. **Agent 搜索演示** - 展示 API 检索过程（RAG 的 Retrieval 环节）
2. **知识库展示** - 展示知识库中的 API 条目
3. **RAG 增强展示** - 展示 API 如何被用于最终代码生成（RAG 的 Augmentation & Generation 环节）

### 📊 数据可视化
- 使用 ECharts 实现数据可视化
- API 来源分布饼图
- 使用质量分布柱状图
- 搜索关键词词云图
- 实时统计概览

### 🔧 技术特性
- 使用真实的 ReqTrans-main 知识库数据（685 个 API）
- 完整的评分算法实现
- 支持 Cargo 和 OpenHarmony GN 构建系统
- 响应式设计，适配不同屏幕尺寸

## 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

访问 http://127.0.0.1:5179/ 查看应用

### 构建生产版本
```bash
npm run build
npm run preview
```

## 项目结构

```
src/
├── components/          # 组件
│   ├── SkillSearchDemo.vue     # 搜索演示组件
│   ├── KnowledgeBaseView.vue   # 知识库视图组件
│   ├── SkillStatistics.vue    # 统计组件
│   └── ApiDetailCard.vue      # API 详情卡片
├── utils/               # 工具函数
│   ├── kb-loader.js          # 知识库加载器
│   └── scoring.js             # 评分算法
├── data/                # 数据文件
│   └── knowledge-base.json    # 知识库数据（从 ReqTrans-main 复制）
└── views/               # 页面视图
    └── SkillsVisualizationView.vue
```

## 核心组件说明

### SkillSearchDemo
- 模拟 Agent 搜索过程
- 展示关键词提取
- 显示搜索评分和排序
- 支持构建系统选择

### KnowledgeBaseView
- 展示知识库内容
- 分类展示 API
- 搜索和筛选功能

### SkillStatistics
- 统计概览
- 可视化图表
- 实时数据更新

## 数据来源

知识库数据来自 ReqTrans-main 项目的 `data/knowledge-base.json`，包含：
- 685 个 OpenHarmony Rust API
- 完整的 API 元数据
- 使用示例和质量评级
- 构建系统集成信息

## 评分算法

实现了与 Python 版本一致的评分算法：
- 关键词匹配和部分匹配
- 质量权重（生产环境: 5.0, 测试: 3.0, 示例: 2.0, 等）
- 来源权重（模块 API: 2.0, 内置 API: 1.8, 等）
- 构建系统兼容性检查

## 开发说明

### 依赖说明
- Vue 3 - 渐进式 JavaScript 框架
- Element Plus - UI 组件库
- ECharts - 数据可视化库
- Vite - 构建工具

### 环境要求
- Node.js >= 16
- npm >= 8

### 部署说明
1. 构建生产版本：`npm run build`
2. 预览：`npm run preview`
3. 将 `dist` 目录部署到服务器

## 许可证

MIT License

## 更新日志

### v0.1.0
- 初始版本发布
- 实现基本 RAG 流程展示
- 集成真实数据
- 完成可视化组件