# Skills Visualizer - 设计文档

## 项目概述

基于 agent-visualizer 的技术栈，构建一个专门展示 ReqTrans 中 Skills 系统真实 RAG 过程的前端可视化平台。该平台将重点展示：

1. **Agent 如何搜索 API**（RAG 的 Retrieval 环节）
2. **知识条目的真实内容和质量**（Knowledge Base 展示）
3. **知识条目如何被用于实际代码生成**（RAG 的 Augmentation & Generation 环节）

**核心目标**：真实的流程展示和实际的数据使用，让用户深入了解 Skills 系统如何通过 RAG 过程实现 API 重用。

## 技术栈

- **前端框架**: Vue 3 + Vite
- **UI 组件库**: Element Plus
- **可视化**: ECharts
- **包管理**: npm

## 项目结构

```
skills-visualizer/
├── public/                   # 静态资源
├── src/
│   ├── components/           # Vue 组件
│   │   ├── SkillSearchDemo.vue      # 搜索案例演示（RAG Retrieval）
│   │   ├── SkillStatistics.vue      # 数据统计分析
│   │   ├── SkillImplementation.vue  # 技术实现细节
│   │   └── KnowledgeBaseEntry.vue   # 知识条目详情组件
│   ├── views/
│   │   └── SkillsVisualizationView.vue  # 主页面
│   ├── utils/
│   │   ├── kb-loader.js        # 知识库加载器
│   │   └── scoring.js          # 评分算法实现
│   ├── data/
│   │   └── knowledge-base.json  # 知识库数据副本（来自 ReqTrans-main）
│   ├── App.vue                # 根组件
│   └── main.js                # 入口文件
├── index.html                 # 入口 HTML
├── package.json               # 项目依赖
└── vite.config.js             # Vite 配置
```

## 数据来源

### 核心数据文件

从 ReqTrans-main 复制真实数据：

1. **`data/knowledge-base.json`**
   - 685 个真实的 API 条目
   - 来自 `KonwledgeBaseConstruct/openharmony_rust_api_kb.json`
   - 包含完整的评分信息、构建兼容性、实际使用证据

2. **算法来源**
   - 评分算法来自 `skills/openharmony_api_reuse/scripts/search_openharmony_rust_api_kb.py`
   - 候选评估标准来自 `skills/openharmony_api_reuse/references/candidate_evaluation.md`

## 核心功能模块

### 1. SkillSearchDemo.vue（搜索案例演示）

**核心作用**：展示 RAG 的 "Retrieval" 环节，真实展示 Agent 如何搜索 API

**主要功能**：
- **真实搜索过程**
  - 输入原始 C++ API（如：IPCMessageParcel::WriteInterfaceToken）
  - 自动提取关键词
  - 选择构建系统（Cargo/OpenHarmony GN）
  - 执行真实搜索算法

- **真实搜索结果**
  - 显示搜索到的 API 列表
  - 展示详细的评分构成（summary×7.0 + api×3.0 + source×1.5 + usage×1.2）
  - 显示构建兼容性信息
  - 展示真实的使用证据代码

- **交互功能**
  - 自定义搜索输入
  - 实时调整评分权重
  - 查看每个 API 的详细信息

### 2. SkillStatistics.vue（数据统计分析）

**核心作用**：展示知识库的真实统计信息

**主要功能**：
- **知识库统计**
  - 总 API 数量：685
  - 来源分布：third_party_crate、module_rust_api、ffi_wrapper、openharmony_builtin
  - 使用质量分布：production、test、example、documentation

- **搜索行为分析**
  - 常见搜索关键词
  - 搜索成功率
  - 评分分布

### 3. SkillImplementation.vue（技术实现细节）

**核心作用**：深入展示评分算法的技术实现

**主要功能**：
- **评分算法可视化**
  - 完整的评分公式展示
  - 分步计算过程
  - 权重调整的实时影响

- **构建兼容性检查**
  - Cargo 依赖格式
  - GN 目标格式
  - 兼容性检查流程

- **使用证据评估**
  - 质量等级权重（production: 5.0, test: 3.0, example: 2.0, documentation: 1.5）
  - 真实的使用证据展示

### 4. KnowledgeBaseEntry.vue（知识条目详情）

**核心作用**：展示单个 API 的完整信息

**主要功能**：
- API 基本信息
- 功能摘要
- 构建兼容性
- 真实的使用证据代码
- 相关链接

## 实现细节

### 评分算法实现

```javascript
// utils/scoring.js
export class Scorer {
  static get QUALITY_WEIGHT() {
    return {
      production: 5.0,
      test: 3.0,
      example: 2.0,
      documentation: 1.5,
      crate_source: 1.2,
      synthetic: 0.5
    }
  }

  static scoreEntry(entry, queryTokens, fieldWeights) {
    // 实现与 search_openharmony_rust_api_kb.py 一致的评分算法
    // 包括：精确匹配、部分匹配、质量得分、来源得分
  }
}
```

### 知识库加载器

```javascript
// utils/kb-loader.js
export class KnowledgeBaseLoader {
  async loadKnowledgeBase() {
    // 加载真实的 knowledge-base.json 数据
    // 包含 685 个 API 条目
  }

  search(query, buildSystem, top) {
    // 使用真实的评分算法执行搜索
    // 返回真实的搜索结果
  }
}
```

## 核心特点

### 1. 真实数据
- 使用 ReqTrans-main 的真实知识库数据
- 包含 685 个 API 的完整信息
- 真实的使用证据和构建兼容性

### 2. 真实算法
- 完整实现原 Python 评分算法
- 支持构建系统过滤
- 包含使用质量评估

### 3. 真实流程
- 展示完整的 RAG 过程
- 从输入到输出的全链路展示
- 真实的搜索结果和评分

### 4. 交互体验
- 实时搜索和评分
- 权重调整可视化
- 详细的信息展示

## 页面布局

```vue
<template>
  <div class="skills-visualization">
    <el-tabs>
      <!-- 搜索案例演示 -->
      <el-tab-pane label="搜索案例演示">
        <SkillSearchDemo />
      </el-tab-pane>
      
      <!-- 数据统计分析 -->
      <el-tab-pane label="数据统计分析">
        <SkillStatistics />
      </el-tab-pane>
      
      <!-- 技术实现细节 -->
      <el-tab-pane label="技术实现细节">
        <SkillImplementation />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
```

## 开发和部署

### 开发环境
```bash
npm install
npm run dev
```

### 构建部署
```bash
npm run build
npm run preview
```

## 总结

该可视化平台专注于展示 Skills 系统的真实 RAG 过程：

1. **通过真实的搜索演示**，展示 Agent 如何使用评分算法找到合适的 API
2. **通过真实的统计数据**，展示知识库的整体情况和分布
3. **通过详细的技术实现**，揭示评分算法的内部工作原理

项目使用真实的 ReqTrans 数据和算法，确保了演示的真实性和教育意义，让用户能够深入了解 Skills 系统如何通过 RAG 过程实现 API 重用。