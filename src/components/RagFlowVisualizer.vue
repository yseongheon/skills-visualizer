<template>
  <div class="rag-flow-panel">
    <!-- ========== 知识库构建（准备阶段 · 离线） ========== -->
    <el-card shadow="never" class="rag-card">
      <template #header>
        <div class="card-head">
          <b><el-icon class="head-icon build-phase"><Files /></el-icon>&nbsp;知识库构建（准备阶段 · 离线）</b>
          <el-tag type="success" effect="light" v-if="indexInfo.built">已构建完成</el-tag>
          <el-tag type="warning" effect="light" v-else>构建中...</el-tag>
        </div>
      </template>

      <!-- 分片 → 向量化 → 入库 三步流水线 -->
      <div class="build-pipeline">
        <div class="pipeline-step" :class="{ done: buildPhase >= 1 }">
          <div class="pipeline-head">
            <span class="pipeline-no">1</span>
            <span class="pipeline-title">分片 Chunking</span>
            <span v-if="buildPhase >= 1" class="pipeline-check"><el-icon><Check /></el-icon></span>
          </div>
          <p class="pipeline-desc">685 个结构化 API 条目 → 每个条目的「功能摘要」+ 全部「使用证据」构成独立 chunk</p>
          <div class="pipeline-stat">
            <el-tag size="small">API 摘要块 × 685</el-tag>
            <el-tag size="small" type="success">代码证据块 × {{ usageChunks }}</el-tag>
            <el-tag size="small" type="info">合计 {{ totalChunks }} 块</el-tag>
          </div>
        </div>

        <el-icon class="pipeline-arrow"><Right /></el-icon>

        <div class="pipeline-step" :class="{ done: buildPhase >= 2 }">
          <div class="pipeline-head">
            <span class="pipeline-no">2</span>
            <span class="pipeline-title">向量化 Embedding</span>
            <span v-if="buildPhase >= 2" class="pipeline-check"><el-icon><Check /></el-icon></span>
          </div>
          <p class="pipeline-desc">对每个 API 的名称与功能摘要调用 Embedding 模型，生成 64 维稠密向量</p>
          <div class="pipeline-stat">
            <el-tag size="small" type="success">已生成 {{ indexInfo.totalEntries }} 个向量</el-tag>
            <el-tag size="small" type="info">维度 64 维</el-tag>
          </div>
        </div>

        <el-icon class="pipeline-arrow"><Right /></el-icon>

        <div class="pipeline-step" :class="{ done: buildPhase >= 3 }">
          <div class="pipeline-head">
            <span class="pipeline-no">3</span>
            <span class="pipeline-title">入库 Vector DB</span>
            <span v-if="buildPhase >= 3" class="pipeline-check"><el-icon><Check /></el-icon></span>
          </div>
          <p class="pipeline-desc">向量与原始条目一并写入向量数据库，建立余弦相似度索引，供在线检索</p>
          <div class="pipeline-stat">
            <el-tag size="small" type="success">685 条已入库</el-tag>
            <el-tag size="small" type="info">索引类型：余弦相似度</el-tag>
          </div>
        </div>
      </div>
    </el-card>

    <!-- ========== RAG 查询输入 ========== -->
    <el-card shadow="never" class="rag-card">
      <template #header>
        <div class="card-head">
          <b><el-icon class="head-icon"><Search /></el-icon>&nbsp;在线问答（回答阶段）</b>
          <div class="query-controls">
            <el-input
              v-model="currentQuery"
              placeholder="输入用户问题，如：file read write 或 JSON 序列化"
              style="width: 380px"
              @keyup.enter="startQuery"
            />
            <el-button type="primary" :loading="isRunning" @click="startQuery">
              <el-icon><VideoPlay /></el-icon>&nbsp;开始检索
            </el-button>
            <el-button @click="resetFlow">
              <el-icon><RefreshRight /></el-icon>&nbsp;重置
            </el-button>
          </div>
        </div>
      </template>

      <el-steps :active="currentStage" align-center finish-status="success" class="rag-steps">
        <el-step
          v-for="(stage, index) in answerStages"
          :key="stage.id"
          :title="stage.title"
          :description="stage.description"
          :status="getStepStatus(index)"
        >
          <template #icon>
            <el-icon v-if="stage.icon" :class="{ 'icon-active': currentStage > index }" size="28">
              <component :is="stage.icon" />
            </el-icon>
          </template>
        </el-step>
      </el-steps>
    </el-card>

    <!-- ========== 各阶段详情 ========== -->
    <div class="phase-details" v-if="started || isRunning">
      <!-- Step 1: Query Processing -->
      <el-card v-if="currentStage >= 0" shadow="never" class="rag-card phase-card" :class="{ active: currentStage === 0 }">
        <template #header>
          <div class="card-head">
            <b><el-icon class="head-icon query"><Search /></el-icon>&nbsp;Query Processing · 查询处理</b>
            <el-tag v-if="currentStage === 0" type="primary" size="small">进行中</el-tag>
            <el-tag v-else type="success" size="small">已完成</el-tag>
          </div>
        </template>
        <div class="phase-body">
          <div class="info-row">
            <span class="info-label">原始查询</span>
            <el-tag type="info" size="large">{{ currentQuery }}</el-tag>
          </div>
          <div class="info-row">
            <span class="info-label">关键词分词</span>
            <el-tag v-for="token in queryTokens" :key="token" type="primary" effect="plain" class="token-tag">
              {{ token }}
            </el-tag>
            <span class="info-note">共 {{ queryTokens.length }} 个关键词（BM25 通道使用）</span>
          </div>
          <div class="info-row" v-if="queryVector">
            <span class="info-label">问题向量化</span>
            <div class="vector-box">
              <span class="vector-badge">Query Embedding · 64 维</span>
              <code class="vector-preview">[{{ vectorPreview }}]</code>
            </div>
            <span class="info-note">查询文本编码为稠密向量（向量通道使用）</span>
          </div>
        </div>
      </el-card>

      <!-- Step 2: Hybrid Recall -->
      <el-card v-if="currentStage >= 1" shadow="never" class="rag-card phase-card" :class="{ active: currentStage === 1 }">
        <template #header>
          <div class="card-head">
            <b><el-icon class="head-icon search"><Files /></el-icon>&nbsp;Hybrid Recall · 混合召回</b>
            <el-tag v-if="currentStage === 1" type="primary" size="small">进行中</el-tag>
            <el-tag v-else type="success" size="small">已完成</el-tag>
          </div>
        </template>
        <div class="phase-body">
          <div class="channel-summary">
            <div class="channel-chip keyword">
              <el-icon><DataAnalysis /></el-icon>
              <span><b>关键词通道</b>：685 条中命中 {{ recallInfo?.totalKeyword || 0 }} 条候选（BM25 风格）</span>
            </div>
            <div class="channel-chip vector">
              <el-icon><Connection /></el-icon>
              <span><b>向量通道</b>：查询向量与 685 个库向量逐一计算余弦相似度，取 Top-{{ recallInfo?.totalVector || 15 }}</span>
            </div>
            <div class="channel-arrow"><el-icon><Down /></el-icon>&nbsp;双通道融合（并集去重）→ 候选 {{ recallCandidates.length }} 个</div>
          </div>

          <div v-if="isSearching" class="recall-progress">
            <el-progress :percentage="recallProgress" :stroke-width="10" text-inside />
          </div>

          <div v-if="!isSearching && recallCandidates.length > 0" class="candidate-list">
            <div v-for="(cand, idx) in recallCandidates" :key="cand.api_name" class="candidate-row">
              <span class="cand-rank">{{ idx + 1 }}</span>
              <div class="cand-main">
                <div class="cand-name">{{ cand.api_name }}</div>
                <div class="cand-meta">
                  <el-tag
                    v-for="ch in cand.channels"
                    :key="ch"
                    size="small"
                    :type="ch === 'keyword' ? 'primary' : 'success'"
                    effect="plain"
                  >
                    {{ ch === 'keyword' ? '关键词命中' : '向量命中' }}
                  </el-tag>
                  <span class="cand-sim" v-if="cand.recallVectorSim > 0">
                    余弦相似度
                    <el-progress
                      :percentage="Math.round(cand.recallVectorSim * 100)"
                      :show-text="false"
                      :stroke-width="6"
                      class="sim-bar"
                    />
                    {{ cand.recallVectorSim.toFixed(3) }}
                  </span>
                </div>
              </div>
              <span class="cand-score">{{ (cand.score || 0).toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- Step 3: Rerank + Build Filter -->
      <el-card v-if="currentStage >= 2" shadow="never" class="rag-card phase-card" :class="{ active: currentStage === 2 }">
        <template #header>
          <div class="card-head">
            <b><el-icon class="head-icon scoring"><TrendCharts /></el-icon>&nbsp;Rerank &amp; Filter · 精排与过滤</b>
            <el-tag v-if="currentStage === 2" type="primary" size="small">进行中</el-tag>
            <el-tag v-else type="success" size="small">已完成</el-tag>
          </div>
        </template>
        <div class="phase-body">
          <el-alert
            type="info"
            :closable="false"
            show-icon
            title="Cross-encoder 重排：将 (查询, 候选) 拼接编码精算得分，融合 usage 代码命中、使用质量、来源权威性，超越双塔召回的粗排序"
            class="phase-alert"
          />

          <div v-if="isReranking" class="recall-progress">
            <el-progress :percentage="rerankProgress" :stroke-width="10" text-inside />
          </div>

          <div v-if="!isReranking && rerankRows.length > 0" class="rerank-table">
            <div class="rerank-head">
              <span class="col-rank">召回排位</span>
              <span class="col-move"></span>
              <span class="col-rank-new">重排后</span>
              <span class="col-name">API 名称</span>
              <span class="col-score">重排得分</span>
              <span class="col-filter">构建过滤</span>
            </div>
            <div
              v-for="row in rerankRows"
              :key="row.api_name"
              class="rerank-row"
              :class="{ filtered: !row.passed, boosted: row.newRank < row.oldRank }"
            >
              <span class="col-rank">{{ row.oldRank }}</span>
              <span class="col-move">
                <el-icon v-if="row.newRank < row.oldRank" class="move-up"><Top /></el-icon>
                <el-icon v-else-if="row.newRank > row.oldRank" class="move-down"><Bottom /></el-icon>
                <span v-else class="move-eq">—</span>
              </span>
              <span class="col-rank-new">{{ row.newRank }}</span>
              <span class="col-name">{{ row.api_name }}</span>
              <span class="col-score">
                <el-progress
                  :percentage="Math.min(100, Math.round(row.rerankScore))"
                  :stroke-width="6"
                  :show-text="false"
                  class="score-bar"
                />
                {{ row.rerankScore.toFixed(1) }}
              </span>
              <span class="col-filter">
                <el-tag
                  size="small"
                  :type="row.passed ? 'success' : 'danger'"
                  effect="plain"
                >
                  {{ row.passed ? '兼容' : `不兼容 ${buildSystemLabel}` }}
                </el-tag>
              </span>
            </div>
            <div class="rerank-foot">
              <el-tag type="success" effect="light" size="large">
                {{ buildSystemLabel }} 过滤后保留 {{ passedCount }} 个候选进入 Prompt
              </el-tag>
            </div>
          </div>
        </div>
      </el-card>

      <!-- Step 4: Prompt & Generation -->
      <el-card v-if="currentStage >= 3" shadow="never" class="rag-card phase-card" :class="{ active: currentStage === 3 }">
        <template #header>
          <div class="card-head">
            <b><el-icon class="head-icon prompt"><ChatDotRound /></el-icon>&nbsp;Prompt &amp; Generation · 生成</b>
            <el-tag v-if="currentStage === 3 && !generated.code" type="primary" size="small">组装中...</el-tag>
            <el-tag v-else-if="isGenerating" type="warning" size="small">LLM 生成中...</el-tag>
            <el-tag v-else type="success" size="small">已生成</el-tag>
          </div>
        </template>
        <div class="phase-body">
          <div class="prompt-area" v-if="promptText">
            <div class="prompt-head">
              <span>Prompt 模板（用户问题 + 精排后的 API 参考发送给大模型）</span>
            </div>
            <pre class="prompt-code">{{ promptText }}</pre>
          </div>

          <div v-if="isGenerating" class="generating-status">
            <el-icon class="is-loading"><Loading /></el-icon>&nbsp;大模型正在生成 Rust 代码...
          </div>

          <div v-if="generated.code" class="generated-box">
            <div class="generated-head">
              <el-icon><MagicStick /></el-icon>&nbsp;LLM 生成的 Rust 代码
              <el-button type="primary" size="small" link @click="copyCode">
                <el-icon><DocumentCopy /></el-icon>&nbsp;复制
              </el-button>
            </div>
            <pre class="generated-code">{{ typedCode }}<span v-if="isTyping" class="type-cursor">▍</span></pre>
            <p class="generated-note">{{ generated.explanation }}</p>
          </div>
        </div>
      </el-card>

      <!-- Step 5: Final Result -->
      <el-card v-if="currentStage >= 4" shadow="never" class="rag-card phase-card" :class="{ active: currentStage === 4 }">
        <template #header>
          <div class="card-head">
            <b><el-icon class="head-icon result"><Promotion /></el-icon>&nbsp;Final Result · 检索引用清单</b>
            <el-tag type="success" size="small">完成</el-tag>
          </div>
        </template>
        <div class="phase-body">
          <p class="result-summary">
            本次回答共引用 <b>{{ passedApis.length }}</b> 个 API（附真实使用证据），完整链路：
            查询处理 → 混合召回 → 精排过滤 → LLM 生成
          </p>
          <div class="ref-list">
            <div v-for="(api, idx) in passedApis" :key="api.api_name" class="ref-item">
              <span class="ref-index">{{ idx + 1 }}</span>
              <div class="ref-main">
                <div class="ref-name">{{ api.api_name }}</div>
                <div class="ref-usage" v-if="api.usage && api.usage[0]">
                  <code>{{ api.usage[0].code }}</code>
                  <span class="ref-file">{{ api.usage[0].file }}:{{ api.usage[0].line }}</span>
                </div>
              </div>
              <el-tag
                size="small"
                :type="getQualityTag(api)"
                effect="plain"
              >{{ getQualityText(api) }}</el-tag>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { KnowledgeBaseLoader } from '../utils/kb-loader'
import { Scorer } from '../utils/scoring'
import {
  embedQuery, mockRerank, generateRustCode
} from '../utils/vector-utils'

/* ================= 状态 ================= */
const currentQuery = ref('')
const started = ref(false)        // 是否已开始过
const isRunning = ref(false)      // 流程运行中
const isSearching = ref(false)    // 召回阶段
const isReranking = ref(false)    // 重排阶段
const isGenerating = ref(false)   // LLM 生成中
const currentStage = ref(-1)      // 当前阶段 0-4
const buildSystem = ref('cargo')

// 知识库构建
const buildPhase = ref(0)         // 0=未开始 1=分片 2=向量化 3=入库
const usageChunks = ref(0)
const totalChunks = ref(0)
const indexInfo = ref({ totalEntries: 0, built: false })

// 查询处理
const queryTokens = ref([])
const queryVector = ref(null)
const vectorPreview = ref('')

// 召回
const recallProgress = ref(0)
const recallInfo = ref(null)
const recallCandidates = ref([])

// 重排
const rerankProgress = ref(0)
const rerankRows = ref([])

// 生成
const promptText = ref('')
const generated = ref({ code: '', explanation: '' })
const typedCode = ref('')
const isTyping = ref(false)
const passedApis = ref([])

const kbLoader = new KnowledgeBaseLoader()

/* ================= 流程定义 ================= */
const answerStages = [
  { id: 'query', title: '查询处理', description: '分词 + 向量化', icon: 'Search' },
  { id: 'recall', title: '混合召回', description: '关键词 + 向量', icon: 'Files' },
  { id: 'rerank', title: '精排过滤', description: 'Cross-encoder + 构建', icon: 'TrendCharts' },
  { id: 'generate', title: '生成', description: 'Prompt → LLM', icon: 'ChatDotRound' },
  { id: 'result', title: '结果', description: '代码 + 引用清单', icon: 'Promotion' }
]

const buildSystemLabel = computed(() =>
  buildSystem.value === 'cargo' ? 'Cargo' : buildSystem.value === 'openharmony_gn' ? 'OpenHarmony GN' : '全部'
)

const passedCount = computed(() => rerankRows.value.filter(r => r.passed).length)

/* ================= 生命周期 ================= */
onMounted(() => {
  // 自动展示「知识库构建」准备过程
  simulateIndexing()
})

/* ================= 知识库构建模拟 ================= */
const simulateIndexing = async () => {
  buildPhase.value = 1
  const info = await kbLoader.getIndexInfo()
  indexInfo.value = info
  usageChunks.value = info.usageChunks
  totalChunks.value = info.totalChunks

  await sleep(800)
  buildPhase.value = 2
  await sleep(800)
  buildPhase.value = 3
}

/* ================= 查询流程 ================= */
const startQuery = async () => {
  if (!currentQuery.value.trim() || isRunning.value) return
  started.value = true
  await resetFlow(false)
  isRunning.value = true
  currentStage.value = 0

  // Step 1: 查询处理
  queryTokens.value = Scorer.tokenize(currentQuery.value)
  queryVector.value = embedQuery(currentQuery.value)
  vectorPreview.value = queryVector.value.slice(0, 12).join(', ')
  await sleep(900)

  // Step 2: 混合召回
  currentStage.value = 1
  isSearching.value = true
  recallProgress.value = 15
  await sleep(400)
  try {
    const result = await kbLoader.searchHybrid(currentQuery.value, buildSystem.value, 30, 15, 8)
    recallInfo.value = {
      totalKeyword: result.totalKeyword,
      totalVector: result.totalVector
    }
    recallCandidates.value = result.candidates
    // 进度动画
    recallProgress.value = 100
    await sleep(600)
  } catch (e) {
    ElMessage.error('检索失败：' + e.message)
    recallProgress.value = 100
  }
  isSearching.value = false
  await sleep(400)

  // Step 3: 精排 + 构建过滤
  currentStage.value = 2
  isReranking.value = true
  rerankProgress.value = 20
  await sleep(500)
  const rerankData = mockRerank(recallCandidates.value, currentQuery.value)
  const rows = rerankData.map(item => {
    const cand = recallCandidates.value.find(c => c.api_name === item.api_name)
    const passed = isBuildCompatible(cand)
    return { ...item, passed, cand }
  })
  rerankRows.value = rows
  rerankProgress.value = 100
  isReranking.value = false
  await sleep(900)

  // Step 4: Prompt + 生成
  currentStage.value = 3
  passedApis.value = rows.filter(r => r.passed).sort((a, b) => a.newRank - b.newRank)
    .map(r => r.cand).slice(0, 5)
  promptText.value = buildPrompt(currentQuery.value, passedApis.value)
  await sleep(600)
  await runGeneration(passedApis.value)

  // Step 5: 完成
  currentStage.value = 4
  isRunning.value = false
}

/* ================= 构建过滤 ================= */
const isBuildCompatible = (api) => {
  if (buildSystem.value === 'any') return true
  const bs = api?.build_support || {}
  return buildSystem.value === 'cargo'
    ? Boolean(bs.cargo_supported)
    : Boolean(bs.openharmony_gn_supported)
}

/* ================= Prompt 组装 ================= */
const buildPrompt = (query, apis) => {
  const lines = []
  lines.push('[系统指令] 你是 OpenHarmony Rust 开发专家。请根据用户需求与检索到的 API 参考，生成可编译的 Rust 代码。')
  lines.push('')
  lines.push(`[用户需求] ${query}`)
  lines.push('')
  lines.push(`[检索参考 API]（已精排，共 ${apis.length} 个，附真实使用证据）`)
  apis.forEach((api, i) => {
    const usage = api.usage?.[0]
    lines.push(`${i + 1}. ${api.api_name}（来源：${api.source?.name || api.api_source_type}）`)
    lines.push(`   功能：${String(api.function_summary || '').slice(0, 90)}...`)
    if (usage) {
      lines.push(`   使用证据：${usage.code}`)
      lines.push(`   证据来源：${usage.file}:${usage.line}（质量：${usage.quality}）`)
    }
  })
  lines.push('')
  lines.push('[任务] 请结合上面的 API 与使用证据，生成解决用户需求的完整 Rust 代码。')
  return lines.join('\n')
}

/* ================= LLM 流式生成 ================= */
const runGeneration = async (apis) => {
  const topApi = apis[0]
  if (!topApi) return
  isGenerating.value = true
  await sleep(700)
  const result = generateRustCode(topApi, currentQuery.value)
  generated.value = result
  isGenerating.value = false

  // 打字机效果
  isTyping.value = true
  typedCode.value = ''
  const full = result.code
  const chunk = 2
  for (let i = 0; i < full.length; i += chunk) {
    typedCode.value += full.slice(i, i + chunk)
    await sleep(18)
  }
  isTyping.value = false
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(typedCode.value)
    ElMessage.success('代码已复制')
  } catch {
    ElMessage.info('复制失败，请手动选择复制')
  }
}

/* ================= 辅助 ================= */
const resetFlow = async (clearQuery = true) => {
  currentStage.value = -1
  isRunning.value = false
  isSearching.value = false
  isReranking.value = false
  isGenerating.value = false
  isTyping.value = false
  queryTokens.value = []
  queryVector.value = null
  vectorPreview.value = ''
  recallInfo.value = null
  recallCandidates.value = []
  recallProgress.value = 0
  rerankRows.value = []
  rerankProgress.value = 0
  promptText.value = ''
  generated.value = { code: '', explanation: '' }
  typedCode.value = ''
  passedApis.value = []
  if (clearQuery) {
    currentQuery.value = ''
    started.value = false
  }
}

const getStepStatus = (index) => {
  if (currentStage > index) return 'success'
  if (currentStage === index) return 'process'
  return 'wait'
}

const getQualityTag = (api) => {
  const q = api.usage?.[0]?.quality || 'synthetic'
  const map = { production: 'success', test: 'primary', example: 'warning', documentation: 'info', synthetic: 'info' }
  return map[q] || 'info'
}

const getQualityText = (api) => {
  const q = api.usage?.[0]?.quality || 'synthetic'
  const map = { production: '生产环境', test: '测试', example: '示例', documentation: '文档', synthetic: '合成' }
  return map[q] || q
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

onBeforeUnmount(() => {
  // 防止卸载后定时器继续
})
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

.head-icon {
  color: var(--primary, #409eff);
  vertical-align: -2px;
}
.head-icon.build-phase { color: #8b5cf6; }
.head-icon.query { color: #409eff; }
.head-icon.search { color: #16a34a; }
.head-icon.scoring { color: #d97706; }
.head-icon.prompt { color: #8b5cf6; }
.head-icon.result { color: #dc2626; }

.query-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* ---------- 知识库构建流水线 ---------- */
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
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #f0f2f5;
  color: #606266;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
  flex-shrink: 0;
}

.pipeline-step.done .pipeline-no {
  background: rgba(22, 163, 74, 0.12);
  color: #16a34a;
}

.pipeline-check {
  color: #16a34a;
  font-size: 16px;
  margin-left: auto;
}

.pipeline-title {
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.pipeline-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  margin: 0 0 12px;
  min-height: 42px;
}

.pipeline-stat {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pipeline-arrow {
  align-self: center;
  color: #b6bec9;
  font-size: 22px;
  flex-shrink: 0;
}

/* ---------- 流程步骤条 ---------- */
.rag-steps {
  padding: 8px 4px 0;
}

.rag-steps :deep(.el-step__title) {
  font-size: 14px;
}

.rag-steps :deep(.el-step__description) {
  font-size: 12px;
}

/* ---------- 阶段卡片 ---------- */
.phase-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.phase-card {
  transition: all 0.3s ease;
}

.phase-card.active {
  border-color: rgba(64, 158, 255, 0.45);
  box-shadow: 0 4px 20px rgba(64, 158, 255, 0.08);
}

.phase-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.phase-alert {
  margin-bottom: 4px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.info-label {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
  min-width: 74px;
}

.info-note {
  font-size: 12px;
  color: #909399;
  margin-left: 6px;
}

.token-tag {
  margin-right: 6px;
}

.vector-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.vector-badge {
  font-size: 12px;
  color: #8b5cf6;
  font-weight: 600;
}

.vector-preview {
  font-size: 12px;
  color: #6b7280;
  background: #f5f3ff;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #ede9fe;
}

/* ---------- 混合召回 ---------- */
.channel-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.channel-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 14px;
  color: #303133;
  line-height: 1.5;
}

.channel-chip.keyword {
  background: rgba(64, 158, 255, 0.07);
  border: 1px solid rgba(64, 158, 255, 0.2);
}

.channel-chip.vector {
  background: rgba(22, 163, 74, 0.06);
  border: 1px solid rgba(22, 163, 74, 0.2);
}

.channel-arrow {
  text-align: center;
  color: #8b5cf6;
  font-weight: 600;
  font-size: 14px;
}

.recall-progress {
  padding: 6px 0;
}

.candidate-list {
  display: flex;
  flex-direction: column;
}

.candidate-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 6px;
  border-bottom: 1px solid #f0f2f5;
}

.candidate-row:last-child { border-bottom: none; }

.cand-rank {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
}

.cand-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.cand-name {
  font-weight: 600;
  color: #303133;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cand-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #909399;
}

.cand-sim {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #16a34a;
}

.sim-bar {
  width: 80px;
}

.cand-score {
  font-weight: 700;
  color: #409eff;
  font-size: 15px;
  flex-shrink: 0;
}

/* ---------- 重排表格 ---------- */
.rerank-table {
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  overflow: hidden;
}

.rerank-head,
.rerank-row {
  display: grid;
  grid-template-columns: 74px 50px 74px 1fr 150px 150px;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  font-size: 13px;
}

.rerank-head {
  background: #fafbfc;
  color: #909399;
  font-weight: 600;
  border-bottom: 1px solid #eef1f5;
}

.rerank-row {
  border-bottom: 1px solid #f0f2f5;
  background: #fff;
  transition: background 0.2s;
}

.rerank-row:last-child { border-bottom: none; }

.rerank-row.boosted {
  background: rgba(22, 163, 74, 0.04);
}

.rerank-row.filtered {
  opacity: 0.55;
  background: #fafbfc;
}

.col-rank,
.col-rank-new {
  text-align: center;
  font-weight: 600;
  color: #303133;
  font-size: 15px;
}

.rerank-row.boosted .col-rank-new {
  color: #16a34a;
  font-size: 17px;
}

.col-move {
  text-align: center;
}

.move-up { color: #16a34a; font-size: 16px; }
.move-down { color: #d97706; font-size: 16px; }
.move-eq { color: #c0c4cc; }

.col-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  color: #303133;
}

.col-score {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #606266;
}

.score-bar {
  width: 70px;
  flex-shrink: 0;
}

.col-filter { text-align: right; }

.rerank-foot {
  padding: 12px 14px;
  border-top: 1px solid #f0f2f5;
  background: #fcfdfe;
}

/* ---------- Prompt 与生成 ---------- */
.prompt-area {
  border: 1px solid #ede9fe;
  border-radius: 10px;
  overflow: hidden;
  background: #fcfbff;
}

.prompt-head {
  padding: 10px 14px;
  background: #f5f3ff;
  color: #6d28d9;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid #ede9fe;
}

.prompt-code {
  margin: 0;
  padding: 14px;
  font-size: 12.5px;
  line-height: 1.65;
  color: #4c1d95;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow: auto;
  font-family: 'Inconsolata', Consolas, monospace;
}

.generating-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8b5cf6;
  font-weight: 600;
  padding: 8px 0;
}

.generated-box {
  border: 1px solid rgba(22, 163, 74, 0.25);
  border-radius: 10px;
  overflow: hidden;
  background: #fbfefb;
}

.generated-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(22, 163, 74, 0.08);
  color: #15803d;
  font-weight: 600;
  font-size: 14px;
  border-bottom: 1px solid rgba(22, 163, 74, 0.15);
}

.generated-head .el-button {
  margin-left: auto;
}

.generated-code {
  margin: 0;
  padding: 16px;
  font-size: 13px;
  line-height: 1.7;
  color: #1e293b;
  background: #f8fafc;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Inconsolata', Consolas, 'Courier New', monospace;
}

.type-cursor {
  animation: blink 0.8s infinite;
  color: #16a34a;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.generated-note {
  margin: 0;
  padding: 12px 14px;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.7;
  background: #fff;
  border-top: 1px solid rgba(22, 163, 74, 0.1);
}

/* ---------- 最终结果 ---------- */
.result-summary {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.7;
  margin: 0;
}

.ref-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ref-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border: 1px solid #e8ecf1;
  border-radius: 8px;
  background: #fff;
}

.ref-index {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
}

.ref-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ref-name {
  font-weight: 600;
  color: #303133;
  font-size: 15px;
}

.ref-usage {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  min-width: 0;
}

.ref-usage code {
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
  color: #476282;
  font-family: 'Inconsolata', Consolas, monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60%;
}

.ref-file {
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 响应式 */
@media (max-width: 1100px) {
  .build-pipeline {
    flex-direction: column;
  }
  .pipeline-arrow {
    transform: rotate(90deg);
    align-self: center;
  }
  .rerank-head,
  .rerank-row {
    grid-template-columns: 50px 30px 50px 1fr;
  }
  .rerank-head .col-score,
  .rerank-head .col-filter,
  .rerank-row .col-score,
  .rerank-row .col-filter {
    display: none;
  }
}

@media (max-width: 768px) {
  .query-controls {
    width: 100%;
  }
  .query-controls .el-input {
    width: 100% !important;
  }
  .card-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
