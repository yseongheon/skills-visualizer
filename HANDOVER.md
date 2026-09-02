# 📋 Skills RAG 可视化平台 — 项目交接文档

> **交接日期**：2026-09-02
> **项目地址**：https://github.com/yseongheon/skills-visualizer
> **本地路径**：`c:\Users\38680\Desktop\前端展示项目\skills-visualizer`

---

## 1. 项目概述

### 1.1 项目定位
Skills RAG 可视化平台是一个用于**演示 AI 系统如何进行 API 搜索和代码生成完整流程**的前端可视化平台。平台使用 **685 个真实的 OpenHarmony Rust API** 数据，通过可视化方式帮助理解 RAG（检索增强生成）技术的工作原理。

### 1.2 核心价值
- **真实数据支撑**：685 个来自 OpenHarmony 源码的实际 Rust API，包含 2467 条真实使用证据
- **完整流程展示**：从查询输入 → 检索 → 评分排序 → 构建系统检查 → 结果生成的完整 RAG 流程
- **可视化教学**：将复杂的 AI 系统内部工作流程直观呈现，帮助理解 AI 工作原理

### 1.3 技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | ^3.5.13 | 前端框架（Composition API） |
| Vite | ^6.0.7 | 构建工具 |
| Element Plus | ^2.9.3 | UI 组件库 |
| ECharts | ^5.5.0 | 数据可视化图表 |
| vue-echarts | ^6.7.3 | Vue 集成 ECharts |
| @element-plus/icons-vue | ^2.3.1 | 图标库 |

---

## 2. 项目结构

```
skills-visualizer/
├── index.html                  # 入口 HTML
├── package.json                # 依赖和脚本
├── vite.config.js              # Vite 配置（端口 5173）
├── .env.example                # 环境变量示例
├── README.md                   # 项目说明
├── UPDATE_LOG.md               # 更新日志
├── HANDOVER.md                 # 本交接文档
│
├── data/                       # 运行时加载的数据（镜像到 /data）
├── dist/                       # 构建产物
├── public/                     # 静态资源
│
└── src/
    ├── main.js                 # 入口文件（注册 Element Plus、全局样式）
    ├── App.vue                 # 根组件（头部、页脚布局）
    │
    ├── views/
    │   └── SkillsVisualizationView.vue  # 主视图（标签页容器）
    │
    ├── components/
    │   ├── LiveSearchMonitor.vue        # 🔍 实时搜索监控（527 行）
    │   ├── RagFlowVisualizer.vue        # 🔄 RAG 流程可视化（核心）
    │   ├── SkillSearchDemo.vue          # 📊 搜索案例演示（505 行）
    │   ├── ElegantStatistics.vue        # 📈 数据统计分析（当前使用）
    │   ├── SimpleTestChart.vue          # 旧版统计组件（已弃用）
    │   ├── SimpleStatistics.vue         # 旧版统计组件（已弃用）
    │   ├── DebugStatistics.vue          # 调试统计组件（已弃用）
    │   ├── SkillImplementation.vue      # ⚙️ 技术实现细节（702 行）
    │   └── KnowledgeBaseEntry.vue       # 知识库条目展示（286 行）
    │
    ├── data/
    │   ├── knowledge-base.json          # 685 条 API 知识库
    │   └── search-examples.json         # 3 个搜索示例
    │
    ├── utils/
    │   ├── kb-loader.js                 # 知识库加载器
    │   ├── scoring.js                   # 评分算法（与 Python 版一致）
    │   └── sample-queries.js            # 示例查询
    │
    └── assets/styles/                   # 样式资源
```

---

## 3. 功能模块说明

### 3.1 🔍 实时搜索监控（LiveSearchMonitor.vue）
- **功能**：模拟 Agent 的实时 API 搜索过程，显示搜索进度、服务器状态、搜索历史
- **特性**：
  - 实时搜索进度条（模拟 20% → 100%）
  - 服务器状态指示（online/offline）
  - 搜索历史记录
  - 自动刷新开关
- **技术要点**：使用 `KnowledgeBaseLoader` 加载真实数据，`setInterval` 模拟渐进搜索

### 3.2 🔄 RAG 流程可视化（RagFlowVisualizer.vue）— **核心模块**
- **功能**：展示 RAG 的完整流程：查询处理 → API 检索 → 评分排序 → 构建检查 → 结果生成
- **五个阶段**：
  1. **Query Processing**：分词处理，显示分词结果和处理时间
  2. **API Search**：知识库检索，显示搜索范围（685 个 API）和搜索策略
  3. **Scoring & Ranking**：评分排序，显示评分维度权重（关键词 40% / 质量 30% / 来源 30%）
  4. **Build System Check**：兼容性检查（cargo/gn），过滤不兼容 API
  5. **Final Results**：展示最终结果列表和评分
- **特性**：
  - 自动演示 / 手动查询两种模式
  - 逐步展示（el-steps 组件）
  - 搜索结果详情（评分明细、使用示例、代码片段）
- **技术要点**：
  - 使用 `Scorer.tokenize()` 分词
  - `KnowledgeBaseLoader.search()` 执行真实检索
  - 模拟异步延迟展示流程

### 3.3 📊 搜索案例演示（SkillSearchDemo.vue）
- **功能**：提供预设搜索案例（消息处理、JSON 序列化、文件操作）
- **特性**：
  - 3 个预设示例查询
  - 手动输入 + 关键词编辑
  - 搜索结果展示（使用证据、代码片段）
- **技术要点**：数据来自 `search-examples.json` 和 `sample-queries.js`

### 3.4 📈 数据统计分析（ElegantStatistics.vue）
- **功能**：685 个 API 的统计分析
- **统计卡片**（4 个核心指标）：
  - 总 API 数量：685
  - 有使用证据：685（100% 覆盖）
  - API 来源种类：4 种
  - 质量等级种类：5 种
- **图表区域**：
  - API 来源分布（饼图/柱图可切换）：
    - 第三方 Rust 包：436
    - OpenHarmony 模块 API：57
    - C++ FFI Rust 封装：147
    - 独立 Rust crate：45
  - 质量分布柱状图（生产/测试/示例/文档/合成）
- **数据表格**：
  - 搜索（API 名称关键词过滤）
  - 排序（使用次数）
  - 分页（10/20/50/100 每页）
  - 详情弹窗
- **技术要点**：ECharts 动态渲染，数据为静态模拟（与真实知识库分布一致）

### 3.5 ⚙️ 技术实现细节（SkillImplementation.vue）
- **功能**：展示项目技术实现原理
- **内容**：
  - 权重配置（质量权重、来源权重）
  - 评分算法说明
  - Cargo/GN 构建系统兼容性检查清单
  - 技术演示开关
- **技术要点**：静态展示 + 交互演示

### 3.6 知识库条目（KnowledgeBaseEntry.vue）
- **功能**：单个 API 条目的详细展示组件
- **特性**：类型标签、质量标签、查看源码、复制 API 名称

---

## 4. 数据说明

### 4.1 知识库（knowledge-base.json）— 685 条
| 字段 | 说明 | 示例 |
|------|------|------|
| `api_name` | API 名称 | `aho_corasick::Match` |
| `api_source_type` | 来源类型 | `third_party_rust_crate` |
| `function_summary` | 功能摘要 | 包含使用证据的描述 |
| `source` | 来源信息 | 仓库名、URL、本地路径、GN target |
| `build_support` | 构建支持 | cargo 依赖配置、GN target |
| `usage` | 使用证据数组 | 质量、文件、行号、代码片段 |

**来源类型分布**：
| 类型 | 数量 | 说明 |
|------|------|------|
| `third_party_rust_crate` | 436 | 第三方 Rust 包 |
| `openharmony_cpp_ffi_rust_wrapper` | 147 | C++ FFI Rust 封装 |
| `openharmony_module_rust_api` | 57 | OpenHarmony 模块 API |
| `openharmony_independent_rust_crate` | 45 | 独立 Rust crate |

**质量分布**（2467 条 usage 记录）：
| 质量等级 | 数量 | 权重 |
|----------|------|------|
| `production` | 1607 | 5.0 |
| `test` | 233 | 3.0 |
| `example` | 397 | 2.0 |
| `documentation` | 111 | 1.5 |
| `crate_source` | 32 | 1.2 |
| `synthetic` | 87 | 0.5 |

### 4.2 评分算法（scoring.js）
与 Python 版 `search_openharmony_rust_api_kb.py` 保持一致：
- **质量权重**：production=5.0, test=3.0, example=2.0, documentation=1.5, crate_source=1.2, synthetic=0.5
- **来源权重**：module_rust_api=2.0, openharmony_builtin=1.8, ffi_wrapper=1.5, third_party_crate=1.0
- **评分维度**：关键词匹配 40% + 质量权重 30% + 来源权重 30%

---

## 5. 环境配置与启动

### 5.1 环境要求
- Node.js ≥ 18
- npm ≥ 9

### 5.2 安装与启动
```bash
# 安装依赖
npm install

# 开发模式（默认端口 5173）
npm run dev

# 生产构建
npm run build

# 预览构建产物
npm run preview
```

### 5.3 环境变量（.env）
```env
VITE_DEFAULT_SEARCH_QUERY=IPC message parcel   # 默认搜索查询
VITE_DEFAULT_BUILD_SYSTEM=cargo                # 默认构建系统
VITE_KNOWLEDGE_BASE_PATH=/data/knowledge-base.json  # 知识库路径
VITE_API_BASE_URL=/api                         # API 基础路径
```

### 5.4 Git 代理配置（中国网络环境必须）
```bash
# 已配置到项目 .git/config，无需重复操作
git config http.proxy http://127.0.0.1:7890
git config http.sslBackend openssl
```
> ⚠️ 若推送失败，先确认代理软件已开启且节点可用

---

## 6. 演示指南（重要）

### 6.1 快速演示流程（10-15 分钟）
1. **项目介绍**（1 分钟）："基于 685 个真实 OpenHarmony Rust API 的 RAG 流程可视化平台"
2. **RAG 流程可视化**（2-3 分钟，**核心**）：
   - 输入查询如 `file read write` 或点击"自动演示"
   - 逐步展示：分词 → 检索 → 评分 → 构建检查 → 结果
   - 强调："真实数据 + 完整 RAG 决策链"
3. **实时搜索监控**（1.5 分钟）：展示 Agent 实时搜索过程
4. **搜索案例演示**（2 分钟）：展示预设案例的实际 API 和代码
5. **数据统计分析**（1.5 分钟）：展示 685 API 的来源分布和质量图表
6. **技术实现细节**（1.5 分钟）：评分算法、权重配置、构建检查
7. **总结**（0.5 分钟）

### 6.2 演示技巧
- 强调 **"真实数据"**（685 个真实 API，非模拟）
- 突出 RAG 流程是 **"AI 系统的核心技术"**
- 演示默认进入 RAG 流程可视化标签页（`activeTab = 'rag'`）

---

## 7. 已知问题与注意事项

### 7.1 已知问题
1. **旧版组件未删除**：`SimpleTestChart.vue`、`SimpleStatistics.vue`、`DebugStatistics.vue` 已被 `ElegantStatistics.vue` 替代，保留作参考，可安全删除
2. **统计数据为静态模拟**：`ElegantStatistics.vue` 中的图表数据是硬编码的（但与真实知识库分布一致），如需实时统计可改为从 `knowledge-base.json` 动态计算
3. **搜索结果详情逻辑**：`RagFlowVisualizer.vue` 中评分维度百分比（40%/30%/30%）为展示文案，实际算法权重在 `scoring.js` 中（质量权重为绝对值 5.0/3.0/2.0...）

### 7.2 注意事项
1. **端口占用**：多次启动 dev 服务器会占满 5173-5189 端口，若启动时提示端口占用，先关闭旧的 node 进程或用 `npm run dev -- --port 5300` 指定端口
2. **数据加载**：`kb-loader.js` 优先从 `/data/knowledge-base.json` 加载，失败时回退到 `./data/`，再失败则用内置模拟数据
3. **Git 推送**：必须通过代理（见 5.4），且代理节点需可用

---

## 8. 后续优化建议

### 8.1 功能增强
- [ ] 统计数据改为从知识库动态计算（`Object.keys` 遍历 685 条）
- [ ] 图表增加更多维度（构建系统兼容性分布、usage 行数分布）
- [ ] RAG 流程增加"生成"阶段展示（根据检索结果生成代码示例）
- [ ] 搜索案例增加自定义保存功能

### 8.2 性能优化
- [ ] 685 条数据表格分页渲染（当前已分页 10/20/50/100）
- [ ] 图表使用 `vue-echarts` 按需引入减少包体积
- [ ] 添加虚拟滚动用于大数据表格

### 8.3 设计优化
- [ ] 删除已弃用的旧组件（SimpleTestChart / SimpleStatistics / DebugStatistics）
- [ ] 统计卡片数据接入真实 API（从 kb-loader 动态加载）
- [ ] 移动端适配完善（当前 tabs 在窄屏可能溢出）

---

## 9. 版本历史

| 提交 | 说明 |
|------|------|
| `b38b786` | 优化 RAG 流程可视化和整体布局（详细步骤信息、默认 RAG 标签页） |
| `d155962` | 完成前端 Clean 设计系统优化（CSS 变量、间距、排版规范化） |
| `1b84fff` | 修复统计仪表盘空图表问题 |
| `36ddf64` | 添加详细 README |
| `325a087` | 添加 LICENSE 和 GitHub 推送说明 |

---

## 10. 联系方式

- **GitHub 仓库**：https://github.com/yseongheon/skills-visualizer
- **本地开发**：Vite 默认 `http://127.0.0.1:5173/`（当前占用时自动递增端口）

---

*本文档由 Claude Code 协助编写，如有疑问请查看 README.md 或项目源码。*
