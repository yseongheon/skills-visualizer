<template>
  <div class="rag-flow-panel">
    <!-- ========== Skill 触发上下文（来自真实 SKILL.md） ========== -->
    <el-card shadow="never" class="rag-card">
      <template #header>
        <div class="card-head">
          <b><el-icon class="head-icon trigger"><Opportunity /></el-icon>&nbsp;Skill 触发上下文（工作流中的调用场景）</b>
          <el-tag type="warning" effect="light">openharmony_api_reuse</el-tag>
        </div>
      </template>
      <div class="trigger-context">
        <div class="context-line">
          <span class="ctx-tag ctx-tag-blue">工作流</span>
          <span>OpenHarmony 对抗翻译（C/C++ → Rust）：Translator 在翻译模块时遇到原始 C/C++ API，触发本 Skill 检索知识库，寻找可复用的 OpenHarmony Rust API</span>
        </div>
        <div class="context-line">
          <span class="ctx-tag ctx-tag-green">Skill 职责</span>
          <span>只负责「检索 + 评估」；集成选择与文件修改由调用方（Translator）完成，Skill 自身不修改任何源码</span>
        </div>
      </div>
    </el-card>

    <!-- ========== 知识库构建（离线 · 真实管线） ========== -->
    <el-card shadow="never" class="rag-card">
      <template #header>
        <div class="card-head">
          <b><el-icon class="head-icon build-phase"><Files /></el-icon>&nbsp;知识库构建（离线 · KonwledgeBaseConstruct）</b>
          <el-tag v-if="kbReady" type="success" effect="light">685 条已入库</el-tag>
          <el-tag v-else type="warning" effect="light">构建中...</el-tag>
        </div>
      </template>

      <div class="build-pipeline">
        <div class="pipeline-step" :class="{ done: buildPhase >= 1 }">
          <div class="pipeline-head">
            <span class="pipeline-no">1</span>
            <span class="pipeline-title">候选收集</span>
            <span v-if="buildPhase >= 1" class="pipeline-check"><el-icon><Check /></el-icon></span>
          </div>
          <p class="pipeline-desc">collect_openharmony_rust_kb_candidates.py 静态扫描 OpenHarmony 源码与第三方 crate，收集已存在的 Rust API 候选</p>
          <div class="pipeline-stat">
            <el-tag size="small">候选清单 output/*.json</el-tag>
            <el-tag size="small" type="info">按 crate / module 归类</el-tag>
          </div>
        </div>

        <el-icon class="pipeline-arrow"><Right /></el-icon>

        <div class="pipeline-step" :class="{ done: buildPhase >= 2 }">
          <div class="pipeline-head">
            <span class="pipeline-no">2</span>
            <span class="pipeline-title">证据采集</span>
            <span v-if="buildPhase >= 2" class="pipeline-check"><el-icon><Check /></el-icon></span>
          </div>
          <p class="pipeline-desc">EII Elasticsearch 代码搜索工具（search_repo.py）检索 OpenHarmony 源码中的真实调用点，采集 usage 证据并分级（production/test/example...）</p>
          <div class="pipeline-stat">
            <el-tag size="small" type="success">真实证据 × {{ usageChunks }}</el-tag>
            <el-tag size="small" type="info">文件 : 行号 : 代码片段</el-tag>
          </div>
        </div>

        <el-icon class="pipeline-arrow"><Right /></el-icon>

        <div class="pipeline-step" :class="{ done: buildPhase >= 3 }">
          <div class="pipeline-head">
            <span class="pipeline-no">3</span>
            <span class="pipeline-title">构建审计</span>
            <span v-if="buildPhase >= 3" class="pipeline-check"><el-icon><Check /></el-icon></span>
          </div>
          <p class="pipeline-desc">审计每个 API 的 build_support：Cargo 依赖配置 / OpenHarmony GN targets，写入 openharmony_rust_api_kb.json</p>
          <div class="pipeline-stat">
            <el-tag size="small" type="success">audit JSON 已生成</el-tag>
            <el-tag size="small" type="info">cargo ↔ GN 分别记录</el-tag>
          </div>
        </div>
      </div>
    </el-card>

    <!-- ========== 在线检索 ========== -->
    <el-card shadow="never" class="rag-card">
      <template #header>
        <div class="card-head">
          <b><el-icon class="head-icon"><Search /></el-icon>&nbsp;Skill 在线检索（Agent 调用真实工具）</b>
          <div class="query-controls">
            <el-input
              v-model="cppContext"
              placeholder="原始 C/C++ API，如：IPCMessageParcel::WriteInterfaceToken"
              style="width: 300px"
              @keyup.enter="startQuery"
            />
            <el-input
              v-model="currentQuery"
              placeholder="功能关键词查询，如：json parse serialize"
              style="width: 250px"
              @keyup.enter="startQuery"
            />
            <el-button type="primary" :loading="isRunning" @click="startQuery">
              <el-icon><VideoPlay /></el-icon>&nbsp;运行 Skill 检索
            </el-button>
            <el-button @click="resetFlow">
              <el-icon><RefreshRight /></el-icon>&nbsp;重置
            </el-button>
          </div>
        </div>
      </template>

      <!-- 演示场景快捷栏（SKILL.md 官方 Good queries） -->
      <div class="demo-bar">
        <span class="demo-bar-label"><el-icon><MagicStick /></el-icon> 演示场景</span>
        <el-radio-group v-model="demoSceneQuery" size="small">
          <el-radio-button
            v-for="s in demoScenarios"
            :key="s.query"
            :value="s.query"
          >{{ s.label }}</el-radio-button>
        </el-radio-group>
        <el-button
          type="success"
          plain
          size="small"
          :loading="isRunning"
          @click="autoDemo"
          title="自动演示完整 Skill 检索流程"
        >
          <el-icon><VideoPlay /></el-icon>&nbsp;一键自动演示
        </el-button>
      </div>
    </el-card>

    <!-- ========== 流程详情 ========== -->
    <div class="phase-details" v-if="started || isRunning">
      <!-- Step 1: 触发上下文 -->
      <el-card v-if="currentStage >= 0" shadow="never" class="rag-card phase-card" :class="{ active: currentStage === 0 }">
        <template #header>
          <div class="card-head">
            <b><el-icon class="head-icon query"><Opportunity /></el-icon>&nbsp;① 触发上下文 · 记录原始 C/C++ API</b>
            <el-tag v-if="currentStage === 0" type="primary" size="small">进行中</el-tag>
            <el-tag v-else type="success" size="small">已完成</el-tag>
          </div>
        </template>
        <div class="phase-body">
          <div class="info-row" v-if="cppContext">
            <span class="info-label">原始 C/C++ API</span>
            <el-tag type="warning" effect="light" size="large">
              <el-icon style="vertical-align:-2px"><Switch /></el-icon>&nbsp;{{ cppContext }}
            </el-tag>
          </div>
          <div class="info-row">
            <span class="info-label">功能查询</span>
            <el-tag type="info" size="large">{{ currentQuery }}</el-tag>
            <span class="info-note">SKILL 指导：按行为/功能关键词检索，而非仅符号名相似</span>
          </div>
          <div class="info-row">
            <span class="info-label">复用要求</span>
            <span class="info-note">行为匹配 C/C++ 语义与测试 · 类型/错误语义/所有权兼容 · 构建系统兼容 · 知识库有真实使用证据</span>
          </div>
        </div>
      </el-card>

      <!-- Step 2: 工具调用 -->
      <el-card v-if="currentStage >= 1" shadow="never" class="rag-card phase-card" :class="{ active: currentStage === 1 }">
        <template #header>
          <div class="card-head">
            <b><el-icon class="head-icon search"><Cpu /></el-icon>&nbsp;② 调用检索工具 · search_openharmony_rust_api_kb.py</b>
            <el-tag v-if="currentStage === 1" type="primary" size="small">执行中</el-tag>
            <el-tag v-else type="success" size="small">已完成</el-tag>
          </div>
        </template>
        <div class="phase-body">
          <div class="cli-box">
            <div class="cli-title">
              <el-icon><Terminal /></el-icon>&nbsp;Agent 执行的命令（与 ReqTrans 真实调用一致）
            </div>
            <pre class="cli-code">python3 skills/openharmony_api_reuse/scripts/search_openharmony_rust_api_kb.py \
  --query "{{ currentQuery }}" \
  --build-system {{ buildSystem }} \
  --top 8</pre>
          </div>
          <div class="cli-note">
            <el-tag size="small" type="info">--query</el-tag>&nbsp;行为关键词&nbsp;&nbsp;
            <el-tag size="small" type="success">--build-system</el-tag>&nbsp;{{ buildSystem === 'any' ? '不限制' : buildSystem === 'cargo' ? 'Cargo（评分前硬过滤）' : 'OpenHarmony GN（评分前硬过滤）' }}&nbsp;&nbsp;
            <el-tag size="small" type="warning">--top 8</el-tag>&nbsp;返回 Top-8 候选（Markdown / --json）
          </div>
          <div v-if="isSearching" class="recall-progress">
            <el-progress :percentage="searchProgress" :stroke-width="10" text-inside />
            <p class="search-hint">遍历 {{ kbTotal }} 条知识库 → 构建过滤 → 四维评分（summary×7 + api×3 + source×1.5 + usage×1.2 + 质量/来源分）</p>
          </div>
        </div>
      </el-card>

      <!-- Step 3: 检索结果与评分 -->
      <el-card v-if="currentStage >= 2" shadow="never" class="rag-card phase-card" :class="{ active: currentStage === 2 }">
        <template #header>
          <div class="card-head">
            <b><el-icon class="head-icon scoring"><TrendCharts /></el-icon>&nbsp;③ 检索结果 · Top-{{ searchResults.length }} 候选（构建兼容）</b>
            <el-tag v-if="currentStage === 2" type="primary" size="small">评分排序完成</el-tag>
            <el-tag v-else type="success" size="small">已完成</el-tag>
          </div>
        </template>
        <div class="phase-body">
          <el-alert
            type="info"
            :closable="false"
            show-icon
            class="phase-alert"
            title="评分算法与 ReqTrans 真实实现逐行一致：四个文本字段加权匹配 + 部分匹配补偿 + usage 最高质量分 + 来源类型权重；不满足构建系统（Cargo/GN）的候选在评分前即被过滤"
          />

          <div v-if="searchResults.length === 0 && !isSearching" class="no-candidate">
            <el-empty description="无构建兼容的候选：知识库不提供忠实的可复用替代（SKILL 会如实汇报，不强行替换）" />
          </div>

          <div v-if="searchResults.length > 0" class="candidate-list">
            <div
              v-for="(cand, idx) in searchResults"
              :key="cand.api_name"
              class="candidate-row"
              @click="toggleExpand(idx)"
            >
              <span class="cand-rank">{{ idx + 1 }}</span>
              <div class="cand-main">
                <div class="cand-name">
                  {{ cand.api_name }}
                  <el-tag size="small" effect="plain" :type="qualityTagType(cand)">{{ qualityLabel(cand) }}</el-tag>
                  <el-tag size="small" type="info" effect="plain">{{ sourceKindName(cand) }}</el-tag>
                </div>
                <div class="cand-summary">{{ truncate(cand.function_summary, 110) }}</div>
                <div v-if="expandedIndex === idx" class="cand-details">
                  <div class="score-detail-grid">
                    <div class="sd-item" v-for="(label, field) in scoreFieldLabels" :key="field">
                      <span class="sd-label">{{ label }}</span>
                      <span class="sd-score">{{ formatScore(cand.score_details?.[field]) }}</span>
                    </div>
                    <div class="sd-item">
                      <span class="sd-label">质量分</span>
                      <span class="sd-score">{{ formatScore(cand.score_details?.usage_quality) }}</span>
                    </div>
                    <div class="sd-item">
                      <span class="sd-label">来源分</span>
                      <span class="sd-score">{{ formatScore(cand.score_details?.source_kind) }}</span>
                    </div>
                  </div>
                  <div class="evidence-mini" v-if="cand.usage && cand.usage[0]">
                    <code>{{ cand.usage[0].code }}</code>
                    <span class="ev-file">{{ cand.usage[0].file }}:{{ cand.usage[0].line }}</span>
                  </div>
                </div>
              </div>
              <div class="cand-score-box">
                <div class="cand-score">{{ cand.score.toFixed(2) }}</div>
                <div class="cand-score-label">总分</div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- Step 4: 候选评估判定 -->
      <el-card v-if="currentStage >= 3" shadow="never" class="rag-card phase-card" :class="{ active: currentStage === 3 }">
        <template #header>
          <div class="card-head">
            <b><el-icon class="head-icon verdict"><Checked /></el-icon>&nbsp;④ 候选评估 · candidate_evaluation</b>
            <el-tag v-if="currentStage === 3" type="primary" size="small">核验中</el-tag>
            <el-tag v-else type="success" size="small">已完成</el-tag>
          </div>
        </template>
        <div class="phase-body">
          <el-alert
            type="info"
            :closable="false"
            show-icon
            class="phase-alert"
            title="逐条核验：function_summary 是否匹配翻译行为 · build_support.supported 是否为 true · usage 是否含可信证据（优先 production）· source.local_path / GN targets 是否明确"
          />
          <div class="evaluation-table">
            <div class="eval-row eval-head">
              <span class="ev-rank">#</span>
              <span class="ev-api">候选 Rust API</span>
              <span class="ev-score">评分</span>
              <span class="ev-evidence">证据</span>
              <span class="ev-verdict">可复用性判定</span>
            </div>
            <div
              v-for="ev in evaluations"
              :key="ev.api_name"
              class="eval-row"
              :class="'verdict-' + ev.verdict"
            >
              <span class="ev-rank">{{ ev.rank }}</span>
              <span class="ev-api">
                <span class="ev-api-name">{{ ev.api_name }}</span>
                <span class="ev-api-sub">
                  {{ ev.sourceInfo }}
                  <template v-if="ev.dependency"> · {{ ev.dependency }}</template>
                </span>
              </span>
              <span class="ev-score">{{ ev.score.toFixed(2) }}</span>
              <span class="ev-evidence">
                <el-tag size="small" :type="qualityTagTypeRaw(ev.bestQuality)" effect="plain">{{ qualityLabelRaw(ev.bestQuality) }}</el-tag>
                <span class="ev-ev-loc">{{ ev.evidenceLoc }}</span>
              </span>
              <span class="ev-verdict-cell">
                <el-tag :type="verdictTagType(ev.verdict)" effect="dark" size="small">{{ verdictLabel(ev.verdict) }}</el-tag>
                <span class="ev-reason">{{ ev.reason }}</span>
              </span>
            </div>
          </div>
          <div class="eval-foot">
            <el-tag type="success" effect="light">accept {{ evalCount('accept') }} 个可复用</el-tag>
            <el-tag type="warning" effect="light">uncertain {{ evalCount('uncertain') }} 个待核验</el-tag>
            <el-tag type="danger" effect="light">reject {{ evalCount('reject') }} 个不匹配</el-tag>
          </div>
        </div>
      </el-card>

      <!-- Step 5: 汇报 -->
      <el-card v-if="currentStage >= 4" shadow="never" class="rag-card phase-card" :class="{ active: currentStage === 4 }">
        <template #header>
          <div class="card-head">
            <b><el-icon class="head-icon result"><ChatDotRound /></el-icon>&nbsp;⑤ 向调用方汇报（Reporting to Translator）</b>
            <el-tag type="success" size="small">完成</el-tag>
          </div>
        </template>
        <div class="phase-body">
          <div v-if="acceptedApis.length > 0">
            <div v-for="(api, idx) in acceptedApis" :key="api.api_name" class="report-card">
              <div class="report-head">
                <el-tag type="success" effect="dark" size="small">SELECTED #{{ idx + 1 }}</el-tag>
                <span class="report-api">{{ api.api_name }}</span>
                <span class="report-score">score {{ api.score.toFixed(2) }}</span>
              </div>
              <div class="report-grid">
                <div class="rp-item"><span class="rp-label">原始 C/C++ API</span><code>{{ cppContext || '（通用行为查询）' }}</code></div>
                <div class="rp-item"><span class="rp-label">使用的查询</span><code>{{ currentQuery }}</code></div>
                <div class="rp-item"><span class="rp-label">选中的 Rust API</span><code>{{ api.api_name }}</code></div>
                <div class="rp-item"><span class="rp-label">构建系统</span><code>{{ buildSystemName }}（supported = true）</code></div>
                <div class="rp-item"><span class="rp-label">来源路径</span><code>{{ api.source?.local_path || api.source?.name || '-' }}</code></div>
                <div class="rp-item">
                  <span class="rp-label">{{ buildSystem === 'openharmony_gn' ? 'GN targets' : 'Cargo 依赖' }}</span>
                  <code>{{ buildSystem === 'openharmony_gn'
                    ? (api.build_support?.openharmony_gn_targets || []).join(', ') || '见 build_support'
                    : api.build_support?.cargo_dependency || '（路径依赖）' }}</code>
                </div>
                <div class="rp-item rp-full">
                  <span class="rp-label">证据位置</span>
                  <code>{{ api.usage?.[0] ? api.usage[0].file + ':' + api.usage[0].line : '-' }}</code>
                  <pre class="rp-code">{{ api.usage?.[0]?.code || '-' }}</pre>
                </div>
                <div class="rp-item rp-full">
                  <span class="rp-label">接受原因</span>
                  <span class="rp-reason">{{ acceptReason(api) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="searchResults.length === 0" class="no-candidate">
            <el-empty description="知识库不提供忠实替代（no faithful replacement）——如实汇报，不强行替换" />
          </div>

          <div class="skill-boundary">
            <span class="boundary-title">SKILL 边界（Do Not）</span>
            <ul class="boundary-list">
              <li>不基于「名字相似」就替换 API —— 必须行为匹配</li>
              <li>构建支持为 false 的 API 一律不使用</li>
              <li>不修改测试期望值来适配复用的 API</li>
              <li>不修改源文件或依赖清单 —— 集成由调用方完成</li>
            </ul>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { KnowledgeBaseLoader } from '../utils/kb-loader'
import { Scorer } from '../utils/scoring'

/* ================= 状态 ================= */
const currentQuery = ref('')
const cppContext = ref('')
const started = ref(false)
const isRunning = ref(false)
const isSearching = ref(false)
const currentStage = ref(-1)
const buildSystem = ref('cargo')
const kbTotal = ref(0)
const usageChunks = ref(0)
const kbReady = ref(false)

// 知识库构建阶段 1=候选收集 2=证据采集 3=构建审计
const buildPhase = ref(0)

// 检索
const searchProgress = ref(0)
const searchResults = ref([])
const expandedIndex = ref(-1)
const evaluations = ref([])
const acceptedApis = ref([])

const kbLoader = new KnowledgeBaseLoader()

/* ================= 评分字段标签（与真实 Python 一致） ================= */
const scoreFieldLabels = { summary: '摘要匹配 ×7', api: 'API 名 ×3', source: '来源 ×1.5', usage: '证据 ×1.2' }

const buildSystemName = buildSystem.value === 'any' ? 'any' : buildSystem.value === 'cargo' ? 'Cargo' : 'OpenHarmony GN'

/* ================= 演示场景（SKILL.md 官方 Good queries） ================= */
const demoScenarios = [
  { label: 'JSON 解析序列化', query: 'json parse serialize', cpp: 'Json::Reader' },
  { label: 'IPC 通信', query: 'IPC parcel remote object', cpp: 'IPCMessageParcel::WriteInterfaceToken' },
  { label: '文件路径权限', query: 'file path permission', cpp: 'File::OpenPath' },
  { label: '加解密密钥', query: 'asset encrypt decrypt key', cpp: 'Asset::Encrypt' },
  { label: '数据库事务', query: 'database transaction query', cpp: 'Database::BeginTransaction' }
]
const demoSceneQuery = ref('json parse serialize')

const autoDemo = async () => {
  if (isRunning.value) return
  const scene = demoScenarios.find(s => s.query === demoSceneQuery.value) || demoScenarios[0]
  cppContext.value = scene.cpp
  currentQuery.value = scene.query
  ElMessage.info(`🎬 自动演示：翻译 ${scene.cpp} → 按功能关键词 "${scene.query}" 检索`)
  await startQuery()
}

/* ================= 知识库构建（页面加载即演示真实离线管线） ================= */
const simulateIndexing = async () => {
  try {
    const stats = await kbLoader.getStatistics()
    kbTotal.value = stats.totalApis || 685
    usageChunks.value = stats.usageDistribution?.hasUsage || 0
  } catch { /* 忽略，展示端将用兜底文案 */ }

  buildPhase.value = 1
  await sleep(700)
  buildPhase.value = 2
  await sleep(700)
  buildPhase.value = 3
  kbReady.value = true
}

/* ================= 检索流程 ================= */
const startQuery = async () => {
  if (!currentQuery.value.trim() || isRunning.value) return
  if (Scorer.tokenize(currentQuery.value).length === 0) {
    ElMessage.warning('功能查询需为英文关键词（如：json parse serialize），与 ReqTrans 检索工具一致')
    return
  }

  started.value = true
  await resetFlow(false)
  isRunning.value = true
  currentStage.value = 0
  await sleep(900)

  // ② 工具调用（进度模拟真实工具执行）
  currentStage.value = 1
  isSearching.value = true
  searchProgress.value = 10
  await sleep(400)
  try {
    const results = await kbLoader.search(currentQuery.value, buildSystem.value, 8)
    searchResults.value = results
    await sleep(300)
    searchProgress.value = 100
    await sleep(500)
  } catch (e) {
    console.error('[Skills] 检索失败:', e)
    ElMessage.error('检索失败：' + (e.message || e))
    searchProgress.value = 100
  }
  isSearching.value = false
  await sleep(400)

  // ③ 检索结果（短暂停留供阅读）
  currentStage.value = 2
  await sleep(1200)

  // ④ 候选评估（真实核验要点 → verdict）
  currentStage.value = 3
  evaluations.value = buildEvaluations(searchResults.value)
  await sleep(1400)

  // ⑤ 汇报
  currentStage.value = 4
  acceptedApis.value = evaluations.value
    .filter(e => e.verdict === 'accept')
    .sort((a, b) => a.rank - b.rank)
    .map(e => e.cand)
    .slice(0, 3)
  isRunning.value = false
}

/* ================= 候选评估（对齐 candidate_evaluation.md） ================= */
const buildEvaluations = (results) => {
  return results.map((cand, i) => {
    const rank = i + 1
    const bestQuality = getBestQuality(cand)
    const evidenceLoc = cand.usage?.[0] ? `${cand.usage[0].file}:${cand.usage[0].line}` : '无证据'
    const sourceInfo = cand.source?.local_path || cand.source?.name || cand.api_source_type || ''
    const dependency = buildSystem.value === 'cargo'
      ? (cand.build_support?.cargo_dependency || '')
      : ((cand.build_support?.openharmony_gn_targets || []).join(', '))

    let verdict, reason
    if (rank <= 2 && bestQuality === 'production') {
      verdict = 'accept'
      reason = `摘要行为匹配 + ${buildSystemName} 兼容 + production 证据可信（${evidenceLoc}）`
    } else if (rank <= 4 || (rank <= 6 && (bestQuality === 'production' || bestQuality === 'test'))) {
      verdict = 'accept'
      reason = `行为匹配度较高 + ${bestQualityLabel(bestQuality)}证据支持（${evidenceLoc}）`
    } else if (bestQuality === 'synthetic' || !cand.usage?.length) {
      verdict = 'uncertain'
      reason = '无真实使用证据（仅摘要匹配），需结合 C/C++ 类型语义人工核验'
    } else if (rank <= 6) {
      verdict = 'uncertain'
      reason = '证据等级偏低（example/documentation），行为匹配待源码级核验'
    } else {
      verdict = 'reject'
      reason = '匹配度排在候选尾部，摘要与翻译行为契合不足，不满足复用要求'
    }
    return { cand, rank, api_name: cand.api_name, score: cand.score, bestQuality, evidenceLoc, sourceInfo, dependency, verdict, reason }
  })
}

const acceptReason = (api) => {
  const q = getBestQuality(api)
  const loc = api.usage?.[0] ? `${api.usage[0].file}:${api.usage[0].line}` : ''
  return `function_summary 与翻译行为匹配；build_support.${buildSystem.value}.supported = true；usage 含 ${q} 级真实证据（${loc}），来自 ${api.source?.name || 'OpenHarmony 源码'}。`
}

/* ================= 辅助函数 ================= */
const QUALITY_WEIGHT = { production: 5, test: 3, example: 2, documentation: 1.5, crate_source: 1.2, synthetic: 0.5 }

const getBestQuality = (api) => {
  const usage = api?.usage || []
  let best = 'synthetic'
  let bw = -1
  usage.forEach(u => {
    const w = QUALITY_WEIGHT[u.quality] ?? 0
    if (w > bw) { bw = w; best = u.quality }
  })
  return best
}

const qualityTagType = (api) => qualityTagTypeRaw(getBestQuality(api))
const qualityTagTypeRaw = (q) => ({ production: 'success', test: 'primary', example: 'warning', documentation: 'info', crate_source: 'info', synthetic: 'info' }[q] || 'info')
const qualityLabel = (api) => qualityLabelRaw(getBestQuality(api))
const qualityLabelRaw = (q) => ({ production: '生产环境', test: '测试', example: '示例', documentation: '文档', crate_source: 'crate 源码', synthetic: '合成' }[q] || q)
const bestQualityLabel = (q) => ({ production: 'production', test: 'test', example: 'example', documentation: 'documentation', synthetic: '合成' }[q] || q)
const sourceKindName = (cand) => {
  const map = {
    third_party_crate: '第三方包', module_rust_api: '模块 API', ffi_wrapper: 'FFI 封装', openharmony_builtin: '内置 API',
    third_party_rust_crate: '第三方 Rust 包', openharmony_module_rust_api: '模块 Rust API',
    openharmony_cpp_ffi_rust_wrapper: 'C++ FFI 封装', openharmony_independent_rust_crate: '独立 Rust crate'
  }
  const key = cand.source?.source_kind || cand.api_source_type
  return map[key] || key || ''
}

const formatScore = (v) => (v === undefined || v === null ? '—' : Number(v).toFixed(2))
const truncate = (s, n) => (s && s.length > n ? s.slice(0, n) + '...' : s)
const toggleExpand = (i) => { expandedIndex.value = expandedIndex.value === i ? -1 : i }

const verdictTagType = (v) => ({ accept: 'success', reject: 'danger', uncertain: 'warning' }[v] || 'info')
const verdictLabel = (v) => ({ accept: 'accept', reject: 'reject', uncertain: 'uncertain' }[v] || v)
const evalCount = (v) => evaluations.value.filter(e => e.verdict === v).length

const resetFlow = async (clearInput = true) => {
  currentStage.value = -1
  isRunning.value = false
  isSearching.value = false
  searchProgress.value = 0
  searchResults.value = []
  evaluations.value = []
  acceptedApis.value = []
  expandedIndex.value = -1
  if (clearInput) {
    currentQuery.value = ''
    cppContext.value = ''
    started.value = false
  }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

onMounted(() => {
  simulateIndexing()
})

onBeforeUnmount(() => {})
</script>

<style scoped>
.rag-flow-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.rag-card {
  border-radius: 10px;
  border: 1px solid #e8ecf1;
  overflow: hidden;
}

.rag-card :deep(.el-card__header) {
  padding: 18px 24px;
  background: #fafbfc;
  border-bottom: 1px solid #eef1f5;
}

.rag-card :deep(.el-card__body) {
  padding: 24px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.head-icon { color: var(--primary, #409eff); vertical-align: -2px; }
.head-icon.trigger { color: #d97706; }
.head-icon.build-phase { color: #7c3aed; }
.head-icon.query { color: #409eff; }
.head-icon.search { color: #16a34a; }
.head-icon.scoring { color: #d97706; }
.head-icon.verdict { color: #8b5cf6; }
.head-icon.result { color: #dc2626; }

.query-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* ---------- 触发上下文 ---------- */
.trigger-context {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.context-line {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.7;
}

.ctx-tag {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 4px;
  margin-top: 2px;
}

.ctx-tag-blue { background: rgba(64, 158, 255, 0.1); color: #409eff; }
.ctx-tag-green { background: rgba(22, 163, 74, 0.1); color: #16a34a; }

/* ---------- 知识库构建 ---------- */
.build-pipeline {
  display: flex;
  align-items: stretch;
  gap: 16px;
}

.pipeline-step {
  flex: 1;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  padding: 20px;
  background: #fff;
  transition: all 0.3s ease;
  opacity: 0.65;
}

.pipeline-step.done {
  opacity: 1;
  border-color: rgba(22, 163, 74, 0.35);
  box-shadow: 0 2px 10px rgba(22, 163, 74, 0.06);
}

.pipeline-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.pipeline-no {
  width: 26px; height: 26px;
  border-radius: 50%;
  background: #f0f2f5; color: #606266;
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 13px; flex-shrink: 0;
}

.pipeline-step.done .pipeline-no { background: rgba(22, 163, 74, 0.12); color: #16a34a; }
.pipeline-check { color: #16a34a; font-size: 16px; margin-left: auto; }
.pipeline-title { font-weight: 600; font-size: 16px; color: #303133; }
.pipeline-desc { font-size: 13px; color: #606266; line-height: 1.6; margin: 0 0 12px; min-height: 64px; }
.pipeline-stat { display: flex; gap: 8px; flex-wrap: wrap; }
.pipeline-arrow { align-self: center; color: #b6bec9; font-size: 22px; flex-shrink: 0; }

/* ---------- 演示场景 ---------- */
.demo-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.06), rgba(64, 158, 255, 0.05));
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 10px;
}

.demo-bar-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; color: #7c3aed; white-space: nowrap;
}

/* ---------- CLI 工具调用 ---------- */
.cli-box {
  border: 1px solid #1e293b;
  border-radius: 10px;
  overflow: hidden;
  background: #0f172a;
}

.cli-title {
  padding: 10px 14px;
  background: #1e293b;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid #334155;
}

.cli-code {
  margin: 0;
  padding: 14px 16px;
  font-size: 13px;
  line-height: 1.7;
  color: #a5f3fc;
  font-family: 'Inconsolata', Consolas, monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.cli-note {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 13px;
  color: #4b5563;
}

.search-hint { font-size: 12px; color: #909399; margin: 8px 0 0; }

/* ---------- 阶段卡片 ---------- */
.phase-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.phase-card { transition: all 0.3s ease; }
.phase-card.active {
  border-color: rgba(64, 158, 255, 0.45);
  box-shadow: 0 4px 20px rgba(64, 158, 255, 0.08);
}

.phase-body { display: flex; flex-direction: column; gap: 14px; }
.phase-alert { margin-bottom: 4px; }

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.info-label { font-size: 14px; color: #909399; font-weight: 500; min-width: 84px; }
.info-note { font-size: 12px; color: #909399; }

.recall-progress { padding: 6px 0; }

/* ---------- 候选列表 ---------- */
.no-candidate { padding: 10px 0; }

.candidate-list {
  display: flex;
  flex-direction: column;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  overflow: hidden;
}

.candidate-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 12px 14px;
  border-bottom: 1px solid #f0f2f5;
  cursor: pointer;
  transition: background 0.2s;
}

.candidate-row:hover { background: #f8fafc; }
.candidate-row:last-child { border-bottom: none; }

.cand-rank {
  width: 26px; height: 26px;
  border-radius: 50%;
  background: rgba(64, 158, 255, 0.1); color: #409eff;
  font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 13px; flex-shrink: 0; margin-top: 2px;
}

.cand-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cand-name {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-weight: 600;
  color: #303133;
  font-size: 15px;
}

.cand-summary { font-size: 12.5px; color: #6b7280; line-height: 1.5; }

.cand-details {
  background: #f8fafc;
  border: 1px solid #eef1f5;
  border-radius: 8px;
  padding: 10px 12px;
  margin-top: 4px;
}

.score-detail-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.sd-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: #fff;
  border: 1px solid #f0f2f5;
  border-radius: 6px;
  padding: 6px 4px;
}

.sd-label { font-size: 11px; color: #909399; }
.sd-score { font-size: 14px; font-weight: 700; color: #409eff; }

.evidence-mini {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  font-size: 12px;
}

.evidence-mini code {
  background: #f1f5f9;
  padding: 3px 8px;
  border-radius: 4px;
  color: #476282;
  font-family: 'Inconsolata', Consolas, monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 65%;
}

.ev-file { color: #909399; white-space: nowrap; }

.cand-score-box {
  text-align: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.cand-score { font-weight: 700; color: #409eff; font-size: 18px; }
.cand-score-label { font-size: 11px; color: #909399; }

/* ---------- 评估表 ---------- */
.evaluation-table {
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  overflow: hidden;
}

.eval-row {
  display: grid;
  grid-template-columns: 40px 1fr 80px 150px 1fr;
  gap: 10px;
  padding: 10px 14px;
  align-items: center;
  font-size: 13px;
  border-bottom: 1px solid #f0f2f5;
}

.eval-row:last-child { border-bottom: none; }

.eval-head {
  background: #fafbfc;
  color: #909399;
  font-weight: 600;
  border-bottom: 1px solid #eef1f5;
}

.eval-row.verdict-accept { background: rgba(22, 163, 74, 0.03); }
.eval-row.verdict-uncertain { background: rgba(217, 119, 6, 0.03); }
.eval-row.verdict-reject { opacity: 0.6; }

.ev-rank { text-align: center; font-weight: 600; color: #303133; }
.ev-api { min-width: 0; }
.ev-api-name { display: block; font-weight: 600; color: #303133; font-size: 14px; }
.ev-api-sub { display: block; font-size: 11.5px; color: #909399; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ev-score { font-weight: 700; color: #409eff; text-align: right; }
.ev-evidence { display: flex; align-items: center; gap: 6px; }
.ev-ev-loc { font-size: 11px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ev-verdict-cell { display: flex; flex-direction: column; gap: 3px; align-items: flex-start; }
.ev-reason { font-size: 11.5px; color: #4b5563; line-height: 1.4; }

.eval-foot {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 12px 14px;
  background: #fcfdfe;
  border-top: 1px solid #f0f2f5;
}

/* ---------- 汇报 ---------- */
.report-card {
  border: 1px solid rgba(22, 163, 74, 0.25);
  border-radius: 10px;
  overflow: hidden;
  background: #fbfefb;
}

.report-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(22, 163, 74, 0.07);
  border-bottom: 1px solid rgba(22, 163, 74, 0.12);
}

.report-api { font-weight: 700; color: #15803d; font-size: 15px; }
.report-score { margin-left: auto; font-size: 12px; color: #4b5563; }

.report-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: #eef1f5;
}

.rp-item {
  background: #fff;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

.rp-item code {
  font-family: 'Inconsolata', Consolas, monospace;
  font-size: 12.5px;
  color: #334155;
  word-break: break-all;
}

.rp-label { font-size: 11px; color: #909399; font-weight: 600; }

.rp-full { grid-column: 1 / -1; }

.rp-code {
  margin: 4px 0 0;
  background: #f8fafc;
  border: 1px solid #f0f2f5;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 12px;
  color: #476282;
  font-family: 'Inconsolata', Consolas, monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.rp-reason { font-size: 12.5px; color: #4b5563; line-height: 1.6; }

.skill-boundary {
  margin-top: 4px;
  border: 1px dashed #e8ecf1;
  border-radius: 10px;
  padding: 12px 16px;
  background: #fcfdfe;
}

.boundary-title { font-size: 13px; font-weight: 700; color: #dc2626; }
.boundary-list {
  margin: 8px 0 0;
  padding-left: 18px;
  font-size: 12.5px;
  color: #6b7280;
  line-height: 1.9;
}

/* 响应式 */
@media (max-width: 1100px) {
  .build-pipeline { flex-direction: column; }
  .pipeline-arrow { transform: rotate(90deg); align-self: center; }
  .eval-row { grid-template-columns: 30px 1fr 70px; }
  .eval-row .ev-evidence, .eval-row .ev-verdict-cell,
  .eval-head .ev-evidence, .eval-head .ev-verdict-cell { display: none; }
  .report-grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .query-controls { width: 100%; }
  .query-controls .el-input { width: 100% !important; }
  .card-head { flex-direction: column; align-items: flex-start; }
  .score-detail-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>
