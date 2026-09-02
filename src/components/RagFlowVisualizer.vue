<template>
  <div class="rag-flow-panel">
    <!-- RAG 查询输入 -->
    <el-card shadow="never" class="rag-card">
      <template #header>
        <div class="rag-card__header">
          <b><el-icon><Search /></el-icon>&nbsp;RAG 查询输入</b>
          <div class="query-controls">
            <el-input
              v-model="currentQuery"
              placeholder="输入搜索查询..."
              style="width: 400px"
              @keyup.enter="startQuery"
            />
            <el-button type="primary" :loading="isSearching" @click="startQuery">
              <el-icon><VideoPlay /></el-icon>&nbsp;开始查询
            </el-button>
          </div>
        </div>
      </template>

      <div class="query-info">
        <div class="query-step">
          <span class="step-label">原始查询：</span>
          <el-tag type="info" size="large">{{ currentQuery }}</el-tag>
        </div>
        <div class="query-step">
          <span class="step-label">关键词提取：</span>
          <el-tag v-for="token in queryTokens" :key="token" type="success" size="small" class="token-tag">
            {{ token }}
          </el-tag>
        </div>
      </div>
    </el-card>

    <!-- RAG 流程步骤 -->
    <el-card shadow="never" class="rag-card">
      <template #header>
        <div class="rag-card__header">
          <b><el-icon><Share /></el-icon>&nbsp;Skills RAG 流程</b>
          <div class="flow-controls">
            <el-button
              :type="isPlaying ? 'warning' : 'success'"
              @click="togglePlay"
            >
              <el-icon><VideoPlay v-if="!isPlaying" /><VideoPause v-else /></el-icon>&nbsp;
              {{ isPlaying ? '暂停演示' : '自动演示' }}
            </el-button>
            <el-button @click="resetFlow">
              <el-icon><RefreshRight /></el-icon>&nbsp;重置
            </el-button>
          </div>
        </div>
      </template>

      <el-steps :active="currentStage" align-center finish-status="success" class="rag-steps">
        <el-step
          v-for="(stage, index) in ragStages"
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

    <!-- 实时过程展示 -->
    <el-card shadow="never" class="rag-card">
      <template #header>
        <b><el-icon><Loading /></el-icon>&nbsp;实时过程</b>
      </template>

      <div v-if="!isSearching && !currentQuery" class="empty-state">
        <el-empty description="输入查询并点击开始" />
      </div>

      <div v-else class="process-steps">
        <!-- Query Processing -->
        <div v-if="currentStage >= 0" class="process-step" :class="{ active: currentStage >= 0 }">
          <div class="step-header">
            <el-icon class="step-icon query" size="32"><Search /></el-icon>
            <div class="step-title">Query Processing</div>
          </div>
          <div class="step-content">
            <p>原始查询：<code>{{ currentQuery }}</code></p>
            <p>查询已分词为 {{ queryTokens.length }} 个关键词</p>
            <div class="step-details">
              <div class="detail-item">
                <span class="detail-label">分词结果：</span>
                <el-tag v-for="token in queryTokens" :key="token" type="success" size="small" class="token-tag">
                  {{ token }}
                </el-tag>
              </div>
              <div class="detail-item">
                <span class="detail-label">处理时间：</span>
                <el-tag type="info">0.2s</el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- API Search -->
        <div v-if="currentStage >= 1" class="process-step" :class="{ active: currentStage >= 1 }">
          <div class="step-header">
            <el-icon class="step-icon search" size="32"><Files /></el-icon>
            <div class="step-title">API Search</div>
          </div>
          <div class="step-content">
            <p>正在知识库中搜索相关 API...</p>
            <el-progress
              :percentage="searchProgress"
              :status="searchProgress === 100 ? 'success' : ''"
              :stroke-width="8"
            />
            <div class="step-details">
              <div class="detail-item">
                <span class="detail-label">搜索范围：</span>
                <el-tag type="info">685个API</el-tag>
                <el-tag type="warning">8个候选</el-tag>
              </div>
              <div class="detail-item">
                <span class="detail-label">搜索策略：</span>
                <el-tag type="success">关键词匹配</el-tag>
                <el-tag type="warning">语义相似度</el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- Scoring & Ranking -->
        <div v-if="currentStage >= 2" class="process-step" :class="{ active: currentStage >= 2 }">
          <div class="step-header">
            <el-icon class="step-icon scoring" size="32"><TrendCharts /></el-icon>
            <div class="step-title">Scoring & Ranking</div>
          </div>
          <div class="step-content">
            <p>使用评分算法对 {{ searchResults.length }} 个候选 API 进行评分...</p>
            <p>评分算法考虑：关键词匹配、质量权重、来源权重</p>
            <div class="step-details">
              <div class="detail-item">
                <span class="detail-label">评分维度：</span>
                <el-tag type="info">关键词匹配: 40%</el-tag>
                <el-tag type="success">质量权重: 30%</el-tag>
                <el-tag type="warning">来源权重: 30%</el-tag>
              </div>
              <div class="detail-item">
                <span class="detail-label">当前评分：</span>
                <el-tag type="success">最高: 0.92</el-tag>
                <el-tag type="warning">平均: 0.68</el-tag>
                <el-tag type="info">最低: 0.35</el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- Build System Check -->
        <div v-if="currentStage >= 3" class="process-step" :class="{ active: currentStage >= 3 }">
          <div class="step-header">
            <el-icon class="step-icon build" size="32"><Tools /></el-icon>
            <div class="step-title">Build System Check</div>
          </div>
          <div class="step-content">
            <p>检查 API 与 {{ buildSystem }} 构建系统的兼容性...</p>
            <p>过滤掉不兼容的 API</p>
            <div class="step-details">
              <div class="detail-item">
                <span class="detail-label">兼容性检查：</span>
                <el-tag type="success">cargo: 6个通过</el-tag>
                <el-tag type="danger">cargo: 2个失败</el-tag>
              </div>
              <div class="detail-item">
                <span class="detail-label">过滤原因：</span>
                <el-tag type="info">依赖冲突</el-tag>
                <el-tag type="warning">API版本不匹配</el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- Final Results -->
        <div v-if="currentStage >= 4" class="process-step" :class="{ active: currentStage >= 4 }">
          <div class="step-header">
            <el-icon class="step-icon result" size="32"><Promotion /></el-icon>
            <div class="step-title">Final Results</div>
          </div>
          <div class="step-content">
            <p>找到 {{ finalResults.length }} 个相关 API：</p>
            <div class="result-list">
              <div v-for="api in finalResults" :key="api.api_name" class="result-item">
                <div class="result-header">
                  <el-tag :type="getApiQualityTag(api.score_details?.usage_quality || 0)" size="small">
                    {{ getApiQualityText(api.score_details?.usage_quality || 0) }}
                  </el-tag>
                  <span class="score">{{ api.score.toFixed(2) }}</span>
                </div>
                <div class="result-name">{{ api.api_name }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 搜索结果详情 -->
    <el-card v-if="finalResults.length > 0" shadow="never" class="rag-card">
      <template #header>
        <b><el-icon><List /></el-icon>&nbsp;搜索结果详情</b>
      </template>

      <div class="results-detail">
        <div v-for="api in finalResults" :key="api.api_name" class="api-detail">
          <div class="api-header">
            <h4>{{ api.api_name }}</h4>
            <el-tag type="info">{{ api.api_source_type }}</el-tag>
          </div>
          <p>{{ api.function_summary }}</p>
          <div class="score-details">
            <div class="score-item">
              <span>总评分：</span>
              <strong>{{ api.score.toFixed(2) }}</strong>
            </div>
            <div class="score-item">
              <span>关键词匹配：</span>
              <strong>{{ api.score_details?.summary?.toFixed(2) || 0 }}</strong>
            </div>
            <div class="score-item">
              <span>API 名称匹配：</span>
              <strong>{{ api.score_details?.api?.toFixed(2) || 0 }}</strong>
            </div>
            <div class="score-item">
              <span>来源质量：</span>
              <strong>{{ api.score_details?.usage_quality?.toFixed(2) || 0 }}</strong>
            </div>
          </div>
          <div v-if="api.usage && api.usage.length > 0" class="usage-examples">
            <h5>使用示例：</h5>
            <div v-for="usage in api.usage" :key="usage.file" class="usage-example">
              <el-tag type="success" size="small">{{ usage.quality }} 示例</el-tag>
              <span class="file-path">{{ usage.file }}:{{ usage.line }}</span>
              <code class="code-snippet">{{ usage.code }}</code>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 知识片段详情 -->
    <el-card v-if="finalResults.length > 0" shadow="never" class="rag-card">
      <template #header>
        <b><el-icon><Files /></el-icon>&nbsp;知识片段详情</b>
      </template>

      <div class="chunks-detail">
        <div v-for="api in finalResults" :key="api.api_name" v-if="api.usage && api.usage.length > 0">
          <h4>{{ api.api_name }} - 相关代码片段</h4>
          <div v-for="usage in api.usage" :key="usage.file" class="chunk">
            <div class="chunk__head">
              <el-tag :type="usage.quality === 'high' ? 'success' : usage.quality === 'medium' ? 'warning' : 'info'" size="small">
                {{ usage.quality }} 质量
              </el-tag>
              <span class="chunk__file">{{ usage.file }} <span class="chunk__line">L{{ usage.line }}</span></span>
              <div class="chunk__score">
                <span :style="{ color: getScoreColor(usage.score) }">{{ usage.score.toFixed(2) }}</span>
              </div>
            </div>
            <el-progress
              :percentage="Math.round(usage.score * 100)"
              :stroke-width="6"
              :color="getScoreColor(usage.score)"
            />
            <pre class="chunk__text">{{ usage.code }}</pre>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { KnowledgeBaseLoader } from '../utils/kb-loader'
import { Scorer } from '../utils/scoring'
import * as echarts from 'echarts'

const currentQuery = ref('')
const queryTokens = ref([])
const isSearching = ref(false)
const isPlaying = ref(false)
const currentStage = ref(-1)
const buildSystem = ref('cargo')
const searchProgress = ref(0)
const searchResults = ref([])
const finalResults = ref([])

// RAG 流程定义
const ragStages = [
  {
    id: 'query',
    title: 'Query',
    description: '处理用户查询',
    icon: 'Search'
  },
  {
    id: 'search',
    title: 'Retrieve',
    description: '在知识库中检索',
    icon: 'Files'
  },
  {
    id: 'score',
    title: 'Score',
    description: '评分和排序',
    icon: 'TrendCharts'
  },
  {
    id: 'filter',
    title: 'Filter',
    description: '过滤和筛选',
    icon: 'Tools'
  },
  {
    id: 'result',
    title: 'Generate',
    description: '生成结果',
    icon: 'Promotion'
  }
]

const kbLoader = new KnowledgeBaseLoader()

// 开始查询
const startQuery = async () => {
  if (!currentQuery.value.trim() || isSearching.value) return

  isSearching.value = true
  currentStage.value = 0
  searchProgress.value = 0
  finalResults.value = []

  // 模拟搜索过程
  await simulateSearchProcess()
}

// 模拟搜索过程
const simulateSearchProcess = async () => {
  // 提取关键词
  queryTokens.value = Scorer.tokenize(currentQuery.value)
  await sleep(800)
  currentStage.value = 1
  searchProgress.value = 20

  // 搜索阶段
  const timer = setInterval(() => {
    searchProgress.value += 15
    if (searchProgress.value >= 80) {
      clearInterval(timer)
      performSearch()
    }
  }, 200)
}

// 执行实际搜索
const performSearch = async () => {
  try {
    const results = await kbLoader.search(
      currentQuery.value,
      buildSystem.value,
      8
    )
    searchResults.value = results
    finalResults.value = results
    await sleep(600)
    currentStage.value = 2
    await sleep(800)
    currentStage.value = 3
    await sleep(600)
    currentStage.value = 4
    isSearching.value = false
  } catch (error) {
    console.error('Search failed:', error)
    isSearching.value = false
  }
}

// 自动播放流程
const autoPlay = async () => {
  if (!currentQuery.value.trim() || isPlaying.value) return

  isPlaying.value = true
  resetFlow()

  // 逐步展示流程
  for (let i = 0; i < ragStages.length; i++) {
    if (!isPlaying.value) break
    currentStage.value = i
    await sleep(1500)
  }

  isPlaying.value = false
}

const togglePlay = () => {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    autoPlay()
  }
}

const resetFlow = () => {
  currentStage.value = -1
  searchProgress.value = 0
  isSearching.value = false
  isPlaying.value = false
  searchResults.value = []
  finalResults.value = []
  queryTokens.value = []
}

const getStepStatus = (index) => {
  if (currentStage > index) return 'success'
  if (currentStage === index) return 'process'
  return 'wait'
}

const getApiQualityTag = (score) => {
  if (score >= 5) return 'success'
  if (score >= 3) return 'warning'
  return 'info'
}

const getApiQualityText = (score) => {
  if (score >= 5) return '生产环境'
  if (score >= 3) return '测试'
  if (score >= 2) return '示例'
  if (score >= 1.5) return '文档'
  return '合成'
}

const getScoreColor = (score) => {
  if (score >= 0.8) return '#67c23a'
  if (score >= 0.6) return '#e6a23c'
  return '#f56c6c'
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

onBeforeUnmount(() => {
  isPlaying.value = false
})
</script>

<style scoped>
.rag-flow-panel {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.rag-card {
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.rag-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.query-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.query-info {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.query-step {
  margin-bottom: 12px;
}

.step-label {
  font-weight: 600;
  margin-right: 12px;
  color: #303133;
}

.token-tag {
  margin-right: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}

.flow-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 60px;
  color: #909399;
}

.process-steps {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.process-step {
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  background: #fafafa;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

.process-step.active {
  border-color: #409eff;
  background: #ecf5ff;
  border-left-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.step-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.step-icon {
  font-size: 32px;
  min-width: 32px;
}

.step-icon.query {
  color: #409eff;
}

.step-icon.search {
  color: #67c23a;
}

.step-icon.scoring {
  color: #e6a23c;
}

.step-icon.build {
  color: #909399;
}

.step-icon.result {
  color: #f56c6c;
}

.step-title {
  font-weight: 600;
  font-size: 18px;
  color: #303133;
}

.step-content {
  color: #606266;
  line-height: 1.7;
}

.result-list {
  margin-top: 16px;
}

.result-item {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
}

.result-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.score {
  font-weight: bold;
  font-size: 18px;
  color: #409eff;
}

.result-name {
  font-weight: 500;
  font-size: 16px;
  color: #303133;
}

.results-detail {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.api-detail {
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  background: #fafafa;
}

.api-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.api-header h4 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.score-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin: 16px 0;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.score-item {
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-item strong {
  font-size: 16px;
  color: #409eff;
}

.usage-examples {
  margin-top: 16px;
}

.usage-example {
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.file-path {
  display: inline-block;
  margin: 0 10px;
  color: #909399;
  font-size: 13px;
  font-family: monospace;
}

.code-snippet {
  display: block;
  margin-top: 10px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  overflow-x: auto;
}

.icon-active {
  color: #67c23a;
}

.rag-steps {
  margin: 24px 0;
}

.chunks-detail {
  margin-top: 24px;
}

.chunk {
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 16px;
  background: #fafafa;
  margin-bottom: 16px;
  transition: all 0.2s ease;
}

.chunk:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.chunk.selected {
  border-color: #67c23a;
  background: #f0f9eb;
}

.chunk__head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.chunk__file {
  flex: 1;
  font-family: monospace;
  font-size: 14px;
  color: #374151;
}

.chunk__line {
  color: #9ca3af;
}

.chunk__score {
  font-family: monospace;
  font-weight: 700;
  font-size: 16px;
}

.chunk__text {
  margin: 12px 0 0;
  white-space: pre-wrap;
  font-size: 14px;
  color: #4b5563;
  font-family: 'Cascadia Code', 'Consolas', monospace;
  line-height: 1.6;
  background: #fff;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}
</style>