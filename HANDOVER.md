# 📋 Skills RAG 可视化平台 — 项目交接文档

> **交接日期**：2026-09-02（最后更新）
> **项目地址**：https://github.com/yseongheon/skills-visualizer
> **上游系统**：[ReqTrans-main](https://github.com/yseongheon/ReqTrans)（OpenHarmony 对抗翻译工作流）
> **本地路径**：`c:\Users\38680\Desktop\前端展示项目\skills-visualizer`

---

## 1. 项目定位（重要前提）

本项目是 **ReqTrans 系统中 `openharmony_api_reuse` Skill 的前端展示**，不是通用 RAG 教学 Demo。

### 1.1 Skill 在真实系统中的位置

```
OpenHarmony 对抗翻译工作流（workFlow）
  → Translator 翻译 C/C++ 模块，遇到原始 C/C++ API
    → 触发 Skill: openharmony_api_reuse
      → 检索 685 条 OpenHarmony Rust API 知识库（构建过滤 + 四维评分）
      → 按 candidate_evaluation.md 评估（accept / reject / uncertain）
      → 向调用方汇报（Skill 自身不改任何文件）
```

### 1.2 忠实性原则

本项目**逐行对齐真实实现**，不虚构流程：
- 评分算法 ↔ `skills/openharmony_api_reuse/scripts/search_openharmony_rust_api_kb.py`（JS 移植版逐行一致）
- 构建过滤（评分前硬过滤 cargo/gn supported）↔ Python `build_supported()`
- 判定标准 ↔ `references/candidate_evaluation.md`
- 演示查询词 ↔ `SKILL.md` 官方推荐 Good queries

---

## 2. 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | ^3.5.13 | Composition API |
| Vite | ^6.0.7 | 构建工具 |
| Element Plus | ^2.9.3 | UI 组件库 |
| ECharts | ^5.5.0 | 图表（统计页） |

---

## 3. 项目结构

```
skills-visualizer/
├── public/data/                # 知识库数据（public 保证 dev/preview/部署都可访问）
│   └── knowledge-base.json     # 685 条真实 API（含 2467 条使用证据）
├── src/
│   ├── main.js                 # 入口 + 全局样式（Clean 设计系统变量）
│   ├── App.vue                 # 页头（蓝）+ 页脚布局
│   ├── views/SkillsVisualizationView.vue   # 3 个标签页容器（流程/统计/实现）
│   ├── components/
│   │   ├── RagFlowVisualizer.vue      # 🔄 Skill 检索流程（核心）
│   │   ├── ElegantStatistics.vue      # 📈 数据统计（真实数据动态计算）
│   │   ├── SkillImplementation.vue    # ⚙️ 技术实现
│   │   └── KnowledgeBaseEntry.vue     # API 条目卡片
│   ├── utils/
│   │   ├── kb-loader.js        # 知识库加载器：loadKnowledgeBase / search / getStatistics
│   │   ├── scoring.js          # 评分算法（Python 逐行移植，勿改权重）
│   │   └── echarts.js          # ECharts 按需引入
│   └── data/                   # 数据源（public/data 的副本）
```

> 精简说明：曾有过 5 标签页版本（含实时搜索监控、搜索案例演示），其功能与核心流程页重叠、展示价值低，已删除；案例/场景能力已内置于流程页演示场景栏。

> ⚠️ **不要修改 scoring.js 的权重值**——它与 ReqTrans 真实算法一致，改了就不"忠实"了。

---

## 4. 核心流程：Skill 检索流程页（RagFlowVisualizer.vue）

页面分 3 块：

### 4.1 Skill 触发上下文卡
展示 Skill 的触发场景（翻译工作流中）与职责边界（只检索评估，不改文件）。

### 4.2 知识库构建卡（离线 · 真实管线）
加载即自动演示 3 步：
1. **候选收集**：`collect_openharmony_rust_kb_candidates.py` 静态扫描源码收集候选
2. **证据采集**：EII Elasticsearch（`search_repo.py`）检索源码采集真实 usage 证据并分级
3. **构建审计**：审计 cargo / openharmony_gn 的 supported 状态

### 4.3 在线检索（5 阶段）
| 阶段 | 展示 | 数据来源 |
|------|------|---------|
| ① 触发记录 | 原始 C/C++ API + 功能查询 + 复用要求 | 用户输入/演示场景 |
| ② 工具调用 | CLI 命令：`python3 ...search_openharmony_rust_api_kb.py --query --build-system --top 8` | 静态模板 |
| ③ 检索结果 | 构建过滤后 Top-8：评分 + 四维明细（展开）+ 证据代码 | `kbLoader.search()` 真实执行 |
| ④ 候选评估 | accept/reject/uncertain + 原因 | 启发式规则（对齐评估文档） |
| ⑤ 汇报 | 结构化汇报卡 + 无解分支 + Do Not 边界 | 静态模板 + 真实数据 |

### 4.4 演示场景
内置 SKILL.md 官方 Good queries（均已验证有充足候选）：
`json parse serialize` / `IPC parcel remote object` / `file path permission` / `asset encrypt decrypt key` / `database transaction query`

---

## 5. 数据与算法

### 5.1 知识库（685 条）
字段：`api_name` / `api_source_type` / `function_summary` / `source`（name/local_path/source_kind/url/gn_target）/ `build_support`（cargo/openharmony_gn）/ `usage`（quality/file/line/code）

来源分布（source_kind）：第三方包 436 / 模块 API 153 / FFI 封装 51 / 内置 45
证据质量：production 5.0 > test 3.0 > example 2.0 > documentation 1.5 > crate_source 1.2 > synthetic 0.5

### 5.2 检索管线（与 Python 一致）
1. `buildSupported(entry, buildSystem)` —— 评分前硬过滤
2. `scoreEntry` —— summary×7 + api×3 + source×1.5 + usage×1.2（精确匹配 + 部分匹配补偿）+ 质量分 + 来源分
3. 排序取 Top-8

### 5.3 评估启发式（前端简化版，与真实评估文档对齐）
- rank ≤ 4 且证据非 synthetic → accept
- 证据缺失/等级低 → uncertain
- 尾部候选（行为匹配不足）→ reject
- 无候选 → "知识库不提供忠实替代"分支

---

## 6. 环境与启动

```bash
npm install && npm run dev     # 默认 5173（占用时自动递增）
npm run build                  # 生产构建
```

**注意**：知识库数据在 `public/data/`——若新增/修改 src/data 下的数据，需同步复制到 public/data（否则部署后加载不到，会静默 fallback 到 mock）。

### Git 推送（中国网络必须走代理）
```bash
git config http.proxy http://127.0.0.1:7890
git config http.sslBackend openssl
```
> 若报 TLS 连接重置：代理节点对 GitHub 不稳定，重试或切换节点。

---

## 7. 演示脚本（10-15 分钟）

1. **开场**：OpenHarmony 对抗翻译 → 翻译 C/C++ 遇到 API → 触发 Skill 找可复用 Rust API
2. **🔄 Skill 检索流程**（核心，8 分钟）：一键自动演示 → 讲解 5 阶段
   - 强调：评分算法与真实 Python 一致、候选证据来自真实 OpenHarmony 源码、accept/reject/uncertain 判定
3. **📈 数据统计**：685 条真实数据动态统计（可现场搜索表格，展示构建兼容性分布）
4. **⚙️ 技术实现**：拖权重看评分变化、构建检查、质量权重

---

## 8. 已知问题与注意事项

1. **已弃用组件**：SimpleTestChart / SimpleStatistics / DebugStatistics / SkillStatistics 可安全删除
2. **评估启发式为简化版**：真实评估需 Agent 对照 C/C++ 源码核验类型/错误语义/生命周期，前端无法完整实现（数据不含源码）
3. **数据同步**：改 src/data 后需同步 public/data
4. **端口占用**：多次启动 dev 会占满 5173+，旧实例需手动关闭
5. **中文查询不支持**：知识库为英文摘要，输入中文会提示（与真实工具一致）

---

## 9. 版本历史

| 提交 | 说明 |
|------|------|
| （待提交） | 真实化改造：删除 mock 向量/重排/LLM 生成，改为真实 Skill 工作流展示 |
| `c7b810d` | RAG 流程可视化升级（当时的 Hybrid RAG 教学版，已被真实化取代） |
| `931ace7` | 添加交接文档 |
| `b38b786` | 优化 RAG 流程可视化和整体布局 |
| `d155962` | Clean 设计系统优化 |

---

## 10. 上游对应关系速查（ReqTrans-main）

| ReqTrans 文件 | 前端对应 |
|--------------|---------|
| `skills/openharmony_api_reuse/SKILL.md` | RagFlowVisualizer 触发上下文 + 演示场景 |
| `.../scripts/search_openharmony_rust_api_kb.py` | scoring.js + kb-loader.search + CLI 展示 |
| `.../references/candidate_evaluation.md` | RagFlowVisualizer ④ 评估阶段 |
| `KonwledgeBaseConstruct/` | RagFlowVisualizer 知识库构建卡 |
| `KonwledgeBaseConstruct/openharmony_rust_api_kb.json` | public/data/knowledge-base.json（685 条） |

---

*如有疑问：先看 README.md，再看本文档；涉及算法一致性以 ReqTrans Python 实现为准。*
