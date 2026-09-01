# Skills RAG 可视化平台

<div align="center">

![Vue](https://img.shields.io/badge/Vue-3-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)
![Element Plus](https://img.shields.io/badge/Element%20Plus-2.9.3-409EFF?style=for-the-badge&logo=element-plus&logoColor=white)
![ECharts](https://img.shields.io/badge/ECharts-5.5.0-5445E3?style=for-the-badge&logo=echarts&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Skills RAG 过程可视化平台 - 展示 ReqTrans Skills 的 RAG 流程**

</div>

## 📖 项目简介

本项目是一个基于 Vue 3 的 Skills RAG（Retrieval-Augmented Generation）过程可视化平台，主要用于展示 ReqTrans Skills 系统中的 RAG 流程。平台实现了从原始 API 查询到最终结果生成的完整可视化，帮助用户理解 Skills 是如何通过 RAG 机制来搜索和生成代码的。

### 核心功能

- 🔍 **实时搜索演示**: 展示从原始 C++ API 提取关键词的过程
- 🔄 **RAG 流程可视化**: 完整展示 Query → Retrieve → Score → Filter → Generate 流程
- 📊 **评分详情透明**: 详细展示每个 API 的评分机制
- 🔧 **构建系统兼容**: 支持 Cargo 和 OpenHarmony GN 构建
- 📝 **使用证据展示**: 显示实际的代码使用示例
- 📈 **统计面板**: 使用 ECharts 进行数据可视化

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173` 查看应用。

### 构建生产版本

```bash
npm run build
npm run preview
```

## 📁 项目结构

```
src/
├── components/          # Vue 组件
│   ├── RagFlowVisualizer.vue      # RAG 流程可视化
│   ├── LiveSearchMonitor.vue      # 实时搜索监控
│   ├── SkillSearchDemo.vue        # Skills 搜索演示
│   ├── KnowledgeBaseView.vue      # 知识库展示
│   └── StatisticsDashboard.vue    # 统计面板
├── utils/              # 工具函数
│   ├── scoring.js                 # 评分算法
│   ├── kb-loader.js               # 知识库加载器
│   └── sample-queries.js          # 示例查询数据
├── data/               # 数据文件
│   └── knowledge-base.json        # 知识库数据
└── views/              # 页面组件
    └── HomeView.vue               # 主页
```

## 🎯 核心组件

### 1. RagFlowVisualizer.vue

展示完整的 RAG 流程：
- Query: 处理用户查询
- Retrieve: 在知识库中检索
- Score: 评分和排序
- Filter: 过滤和筛选
- Generate: 生成结果

### 2. LiveSearchMonitor.vue

实时监控搜索状态：
- 服务器状态指示器
- 搜索历史记录
- 知识库统计信息

### 3. SkillSearchDemo.vue

Skills 搜索演示功能：
- 原始 API 输入
- 关键词提取
- 构建系统选择
- 搜索结果展示

### 4. KnowledgeBaseView.vue

知识库展示：
- API 列表
- 分类筛选
- 详情查看

### 5. StatisticsDashboard.vue

统计面板：
- 搜索趋势图表
- API 分布统计
- 性能监控

## 🔧 技术栈

- **前端框架**: Vue 3 (Composition API)
- **UI 组件库**: Element Plus
- **图表库**: ECharts + vue-echarts
- **构建工具**: Vite
- **包管理**: npm
- **版本控制**: Git

## 📊 数据来源

项目使用真实的 OpenHarmony Rust API 知识库，包含：
- 685 个 API 接口
- 完整的函数摘要
- 构建系统兼容性信息
- 实际代码使用示例

## 🎨 功能特性

### 搜索功能

1. **关键词提取**: 自动从原始 API 名称提取关键词
2. **多系统支持**: 支持 Cargo 和 OpenHarmony GN 构建
3. **实时搜索**: 即时显示搜索结果
4. **评分机制**: 基于多个维度的智能评分

### 可视化展示

1. **流程图**: 展示 RAG 的完整流程
2. **实时动画**: 搜索过程的动画展示
3. **评分详情**: 透明化评分过程
4. **统计图表**: 使用 ECharts 展示数据

### 交互功能

1. **自动演示**: 自动播放完整的搜索流程
2. **手动控制**: 用户可以控制演示进度
3. **详情展开**: 点击查看 API 详细信息
4. **历史记录**: 保存搜索历史

## 🔍 使用示例

### 基本搜索

```javascript
// 使用评分算法进行搜索
import { Scorer } from '@/utils/scoring'

const results = Scorer.search(
  'message parcel write interface token',
  'cargo',
  10
)
```

### 加载知识库

```javascript
import { KnowledgeBaseLoader } from '@/utils/kb-loader'

const kbLoader = new KnowledgeBaseLoader()
const results = await kbLoader.search(query, buildSystem, top)
```

## 📝 开发指南

### 添加新的评分维度

1. 在 `utils/scoring.js` 中修改 `fieldWeights`
2. 在 `_calculateFieldScores` 中添加新的评分逻辑
3. 更新 UI 组件以显示新的评分维度

### 添加新的可视化组件

1. 在 `components/` 目录下创建新组件
2. 导入所需的工具和数据
3. 在主页面中注册和使用

### 自定义主题

修改 `src/styles/variables.css` 来自定义 Element Plus 主题。

## 🤝 贡献指南

我们欢迎各种形式的贡献！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 开发规范

- 使用 ESLint 和 Prettier 格式化代码
- 编写清晰的组件注释
- 保持组件的单一职责原则
- 确保在不同浏览器中兼容

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Element Plus](https://element-plus.org/) - Vue 3 UI 组件库
- [ECharts](https://echarts.apache.org/) - 强大的数据可视化图表库

## 📞 联系方式

- 项目地址: https://github.com/yseongheon/skills-visualizer
- 作者: yseongheon
- 问题反馈: [Issues](https://github.com/yseongheon/skills-visualizer/issues)

---

<div align="center">

**如果这个项目对您有帮助，请给我们一个 ⭐ Star！**

</div>