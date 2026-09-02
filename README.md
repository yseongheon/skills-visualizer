# Skills RAG 可视化平台

<div align="center">

![Vue](https://img.shields.io/badge/Vue-3-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)
![Element Plus](https://img.shields.io/badge/Element%20Plus-2.9.3-409EFF?style=for-the-badge&logo=element-plus&logoColor=white)
![ECharts](https://img.shields.io/badge/ECharts-5.5.0-5445E3?style=for-the-badge&logo=echarts&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**OpenHarmony API 复用 Skill（openharmony_api_reuse）过程可视化平台**

</div>

## 📖 项目简介

本项目是 **ReqTrans 系统中 `openharmony_api_reuse` Skill** 的前端可视化平台。该 Skill 在 **OpenHarmony C/C++ → Rust 对抗翻译工作流**中被触发：当 Translator 翻译模块时遇到原始 C/C++ API，Skill 负责在 OpenHarmony Rust API 知识库（685 条真实 API）中检索可复用的 Rust API，并给出可复用性评估。

平台完整、真实地还原了 Skill 的整个工作过程：

- **知识库构建**（离线）：候选收集 → Elasticsearch 源码证据采集 → 构建系统审计
- **Skill 在线检索**：触发上下文 → 调用真实检索工具（`search_openharmony_rust_api_kb.py`）→ 构建过滤 + 四维评分 → 候选评估（accept / reject / uncertain）→ 向调用方结构化汇报

> ⚠️ 本项目**忠实还原真实实现**：评分算法、构建过滤、评估判定均与 ReqTrans 中的 Python 实现逐行一致，不包含任何虚构的流程环节。

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0

### 安装与启动

```bash
npm install        # 安装依赖
npm run dev        # 开发模式（默认 http://127.0.0.1:5173）
npm run build      # 生产构建
npm run preview    # 预览构建产物
```

## 📁 项目结构

```
skills-visualizer/
├── public/data/                # 知识库数据（dev/部署均可访问）
│   ├── knowledge-base.json     # 685 条真实 OpenHarmony Rust API
│   └── search-examples.json    # 搜索示例
└── src/
    ├── main.js                 # 入口（Element Plus + 全局样式）
    ├── App.vue                 # 根组件（页头/页脚布局）
    ├── views/
    │   └── SkillsVisualizationView.vue   # 主视图（5 个标签页）
    ├── components/
    │   ├── LiveSearchMonitor.vue         # 🔍 实时监控（检索历史/状态）
    │   ├── RagFlowVisualizer.vue         # 🔄 Skill 检索流程（核心）
    │   ├── SkillSearchDemo.vue           # 📊 搜索案例演示
    │   ├── ElegantStatistics.vue         # 📈 数据统计（真实数据动态计算）
    │   ├── SkillImplementation.vue       # ⚙️ 技术实现（评分/构建/证据）
    │   └── KnowledgeBaseEntry.vue        # API 条目展示
    ├── utils/
    │   ├── kb-loader.js        # 知识库加载器（检索入口）
    │   └── scoring.js          # 评分算法（Python 逐行移植）
    └── data/
        ├── knowledge-base.json # 知识库源数据
        └── search-examples.json
```

## 🎯 核心页面说明

### 🔄 Skill 检索流程（RagFlowVisualizer.vue）— 核心

完整展示 Skill 的真实工作流程（5 个阶段）：

| 阶段 | 内容 | 对应真实实现 |
|------|------|------------|
| 触发上下文 | Translator 翻译遇到 C/C++ API，记录翻译上下文与功能查询 | `SKILL.md` Workflow 1 |
| ① 触发记录 | 原始 C/C++ API、行为关键词、复用要求 | `SKILL.md` |
| ② 工具调用 | 展示真实 CLI 命令与参数 | `search_openharmony_rust_api_kb.py` |
| ③ 检索评分 | 构建硬过滤 → 四维加权评分 → Top-8（可展开评分明细与真实证据） | `search_openharmony_rust_api_kb.py` 评分逻辑 |
| ④ 候选评估 | 逐条核验 → accept / reject / uncertain 判定 | `candidate_evaluation.md` |
| ⑤ 汇报 | 结构化汇报卡（含无解分支与 Skill 边界） | `SKILL.md` Workflow 5 |

演示场景内置 SKILL 文档官方推荐的 5 个行为导向查询（`json parse serialize` / `IPC parcel remote object` 等），一键自动演示完整流程。

### 🔍 实时监控（LiveSearchMonitor.vue）

Agent 视角的监控台：服务器状态、搜索历史、知识库统计、最近 Skill 检索记录（真实检索结果）。

### 📊 搜索案例演示（SkillSearchDemo.vue）

输入原始 C/C++ API（如 `IPCMessageParcel::WriteInterfaceToken`）或自然语言查询 → 关键词提取 → 真实检索 → 评分详情/构建兼容性/使用证据。

### 📈 数据统计（ElegantStatistics.vue）

从 685 条真实知识库动态计算：来源分布（4 类）、API 级质量分布（6 级）、真实 API 表格（可搜索/排序/查看证据详情）。

### ⚙️ 技术实现（SkillImplementation.vue）

评分公式（权重实时可调）、构建兼容性检查（Cargo/GN）、使用证据质量权重体系。

## 🔧 技术栈

- **前端框架**: Vue 3 (Composition API) + Vite
- **UI 组件库**: Element Plus
- **图表库**: ECharts
- **数据**: 685 条真实 OpenHarmony Rust API（含 2467 条真实使用证据）

## 📊 数据与算法

### 数据来源

知识库来自 [ReqTrans-main](https://github.com/yseongheon/ReqTrans) 的 `KonwledgeBaseConstruct/` 构建管线：
- `collect_openharmony_rust_kb_candidates.py` 收集 OpenHarmony 源码中的 Rust API 候选
- Elasticsearch 代码搜索工具（`EII/search_repo.py`）采集真实调用点作为 usage 证据
- 审计每个 API 的 `build_support`（Cargo / OpenHarmony GN）

### 评分算法

与 `skills/openharmony_api_reuse/scripts/search_openharmony_rust_api_kb.py` **逐行一致**：

```
总评分 = Σ(字段分 × 权重) + usage 最高质量分 + 来源类型分
字段权重：摘要 7.0 / API 名 3.0 / 来源 1.5 / 使用证据 1.2
质量权重：production 5.0 / test 3.0 / example 2.0 / documentation 1.5 / crate_source 1.2 / synthetic 0.5
来源权重：module_rust_api 2.0 / openharmony_builtin 1.8 / ffi_wrapper 1.5 / third_party_crate 1.0
```

### 可复用性判定

依据 `candidate_evaluation.md`：
- **accept**: 行为匹配 + 构建兼容 + 证据可信（优先 production）
- **reject**: 构建不兼容 / 行为不匹配
- **uncertain**: 证据不足，需人工核验

## 🎬 演示指南

1. 进入页面默认显示 **🔄 Skill 检索流程**
2. 点击 **"一键自动演示"**（内置 5 个官方场景）或手动输入：
   - 原始 C/C++ API（可选，如 `IPCMessageParcel::WriteInterfaceToken`）
   - 功能查询（必填，如 `json parse serialize`）
3. 观察完整流程：触发 → 工具调用（CLI）→ 检索评分 → 评估判定 → 汇报

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

- 项目地址: https://github.com/yseongheon/skills-visualizer
- 问题反馈: [Issues](https://github.com/yseongheon/skills-visualizer/issues)
