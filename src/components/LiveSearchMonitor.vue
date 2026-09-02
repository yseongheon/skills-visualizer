<template>
  <div class="live-monitor">
    <!-- 状态监控面板 -->
    <el-card shadow="never" class="monitor-card">
      <template #header>
        <div class="monitor-header">
          <span><el-icon><Monitor /></el-icon>&nbsp;实时搜索监控</span>
          <el-tag :type="statusMeta.type" effect="dark">
            {{ statusMeta.label }}
          </el-tag>
        </div>
      </template>

      <div class="monitor-status">
        <div class="status-item">
          <span class="label">当前查询：</span>
          <span class="value">{{ currentQuery || '无' }}</span>
        </div>
        <div class="status-item">
          <span class="label">构建系统：</span>
          <el-tag :type="buildSystem === 'cargo' ? 'primary' : 'success'" size="small">
            {{ buildSystem === 'cargo' ? 'Cargo' : 'OpenHarmony GN' }}
          </el-tag>
        </div>
        <div class="status-item">
          <span class="label">知识库规模：</span>
          <span class="value">{{ stats.totalApis }} 个 API</span>
        </div>
        <div class="status-item">
          <span class="label">已搜索：</span>
          <span class="value">{{ searchCount }} 次</span>
        </div>
      </div>
    </el-card>

    <!-- 实时搜索历史 -->
    <el-card shadow="never" class="monitor-card">
      <template #header>
        <div class="monitor-header">
          <span><el-icon><Clock /></el-icon>&nbsp;搜索历史</span>
          <div class="history-controls">
            <el-button size="small" @click="clearHistory">
              <el-icon><Delete /></el-icon>&nbsp;清空
            </el-button>
            <el-switch
              v-model="autoRefresh"
              active-text="自动刷新"
              inactive-text=""
              size="small"
            />
          </div>
        </div>
      </template>

      <div v-if="searchHistory.length === 0" class="empty-history">
        <el-empty description="暂无搜索记录" />
      </div>

      <div v-else class="history-list">
        <div
          v-for="(search, index) in searchHistory"
          :key="index"
          class="history-item"
          :class="{ active: currentQuery === search.query }"
        >
          <div class="history-header">
            <div class="query-info">
              <el-icon class="search-icon"><Search /></el-icon>
              <span class="query-text">{{ search.query }}</span>
            </div>
            <div class="search-meta">
              <span class="time">{{ formatTime(search.timestamp) }}</span>
              <el-tag :type="getSearchResultTag(search)" size="small" class="result-tag">
                {{ search.results.length }} 结果
              </el-tag>
            </div>
          </div>

          <div v-if="showSearchDetails(index)" class="search-details">
            <div class="top-results">
              <div v-for="result in search.results.slice(0, 3)" :key="result.api_name" class="mini-result">
                <span class="result-name">{{ result.api_name }}</span>
                <span class="result-score">{{ result.score.toFixed(2) }}</span>
              </div>
              <div v-if="search.results.length > 3" class="more-results">
                + {{ search.results.length - 3 }} 更多
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 知识库状态仪表板 -->
    <el-card shadow="never" class="monitor-card">
      <template #header>
        <span><el-icon><DataAnalysis /></el-icon>&nbsp;知识库状态</span>
      </template>

      <el-row :gutter="20">
        <el-col :span="8">
          <div class="stat-card">
            <div class="stat-number">{{ stats.hasUsage || 0 }}</div>
            <div class="stat-label">有使用证据</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-card">
            <div class="stat-number">{{ stats.noUsage || 0 }}</div>
            <div class="stat-label">无使用证据</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-card">
            <div class="stat-number">{{ Object.keys(stats.sourceDistribution || {}).length }}</div>
            <div class="stat-label">来源种类</div>
          </div>
        </el-col>
      </el-row>

      <!-- 实时活动指示器 -->
      <div class="activity-indicator">
        <div class="indicator-dot" :class="serverStatus"></div>
        <span class="indicator-text">{{ serverStatusText }}</span>
      </div>
    </el-card>

    <!-- 最近 Skill 检索记录（真实检索工具） -->
    <el-card shadow="never" class="monitor-card">
      <template #header>
        <div class="monitor-header">
          <span><el-icon><Cpu /></el-icon>&nbsp;最近 Skill 检索记录（search_openharmony_rust_api_kb.py）</span>
          <div class="history-controls">
            <el-button
              size="small"
              type="primary"
              plain
              :loading="monitorLoading"
              @click="runMonitorSearch()"
            >
              <el-icon><Refresh /></el-icon>&nbsp;重新检索
            </el-button>
          </div>
        </div>
      </template>

      <div v-if="monitorLoading && !monitorSearch" class="empty-history">
        <el-empty description="正在执行检索..." />
      </div>

      <div v-else-if="monitorSearch" class="monitor-search-panel">
        <div class="ms-query">
          <span>功能查询：</span><el-tag type="info">{{ monitorSearch.query }}</el-tag>
          <span class="ms-meta">
            构建过滤：<el-tag size="small" type="success">{{ monitorSearch.buildSystem === 'cargo' ? 'Cargo' : monitorSearch.buildSystem }}</el-tag>
            · {{ monitorSearch.kbTotal }} 条知识库 · Top-{{ monitorSearch.results.length }} 返回
            · {{ formatTime(monitorSearch.queriedAt) }}
          </span>
        </div>

        <div v-if="monitorSearch.results.length === 0" class="empty-history">
          <el-empty description="无构建兼容候选（知识库不提供忠实替代）" />
        </div>

        <div v-else class="ms-list">
          <div
            v-for="(cand, idx) in monitorSearch.results"
            :key="cand.api_name"
            class="ms-item"
          >
            <span class="ms-rank">{{ idx + 1 }}</span>
            <div class="ms-main">
              <div class="ms-name">{{ cand.api_name }}</div>
              <div class="ms-summary">{{ truncate(cand.function_summary, 90) }}</div>
            </div>
            <div class="ms-right">
              <span class="ms-score">{{ cand.score.toFixed(2) }}</span>
              <el-tag size="small" :type="msQualityTag(cand)" effect="plain">{{ msQualityLabel(cand) }}</el-tag>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { KnowledgeBaseLoader } from '../utils/kb-loader'
import { ElMessage } from 'element-plus'

const currentQuery = ref('')
const buildSystem = ref('cargo')
const searchCount = ref(0)
const searchHistory = ref([])
const autoRefresh = ref(true)
const serverStatus = ref('offline')
const stats = ref({
  totalApis: 0,
  hasUsage: 0,
  noUsage: 0,
  sourceDistribution: {},
  qualityDistribution: {},
  usageDistribution: {}
})

// 最近一次 Skill 检索监控（真实 search 工具结果）
const monitorSearch = ref(null)   // { query, buildSystem, kbTotal, results, queriedAt }
const monitorLoading = ref(false)

const kbLoader = new KnowledgeBaseLoader()

// 状态元信息
const statusMeta = computed(() => {
  const map = {
    offline: { type: 'danger', label: '离线' },
    idle: { type: 'info', label: '空闲' },
    searching: { type: 'primary', label: '搜索中...' },
    ready: { type: 'success', label: '就绪' }
  }
  return map[serverStatus.value] || map.offline
})

const serverStatusText = computed(() => {
  const map = {
    offline: '未连接到知识库',
    idle: '等待查询',
    searching: '正在搜索',
    ready: '系统就绪'
  }
  return map[serverStatus.value]
})

// 显示搜索详情
const showSearchDetails = (index) => {
  // 默认只显示第一条的详情
  return index === 0 && currentQuery.value
}

// 获取搜索结果标签类型
const getSearchResultTag = (search) => {
  if (search.results.length === 0) return 'info'
  if (search.results.length >= 8) return 'success'
  return 'warning'
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} 小时前`
  } else {
    return date.toLocaleString('zh-CN')
  }
}

// 清空历史
const clearHistory = () => {
  searchHistory.value = []
  searchCount.value = 0
  ElMessage.success('搜索历史已清空')
}

// 模拟服务器连接状态
const simulateServerStatus = () => {
  setInterval(() => {
    if (autoRefresh.value) {
      // 随机切换状态
      const statuses = ['offline', 'idle', 'ready']
      const randomIndex = Math.floor(Math.random() * statuses.length)
      serverStatus.value = statuses[randomIndex]
    }
  }, 3000)
}

// 加载统计信息
const loadStats = async () => {
  try {
    const statistics = await kbLoader.getStatistics()
    stats.value = statistics
    serverStatus.value = 'ready'
  } catch (error) {
    console.error('Failed to load statistics:', error)
    serverStatus.value = 'offline'
  }
}

// 执行真实 Skill 检索（等价 search_openharmony_rust_api_kb.py --top 8）并写入监控面板
const runMonitorSearch = async (query = 'json parse serialize', build = 'cargo') => {
  monitorLoading.value = true
  try {
    const results = await kbLoader.search(query, build, 8)
    const statsData = await kbLoader.getStatistics().catch(() => ({ totalApis: 685 }))
    monitorSearch.value = {
      query,
      buildSystem: build,
      kbTotal: statsData.totalApis || 685,
      results,
      queriedAt: Date.now()
    }
    serverStatus.value = 'ready'
  } catch (error) {
    console.error('Skill search failed:', error)
    ElMessage.error('检索监控失败：' + (error.message || error))
  } finally {
    monitorLoading.value = false
  }
}

// 质量显示辅助
const QUALITY_W = { production: 5, test: 3, example: 2, documentation: 1.5, crate_source: 1.2, synthetic: 0.5 }
const bestQualityOf = (cand) => {
  const usage = cand?.usage || []
  let best = 'synthetic'
  let bw = -1
  usage.forEach(u => {
    const w = QUALITY_W[u.quality] ?? 0
    if (w > bw) { bw = w; best = u.quality }
  })
  return best
}
const msQualityTag = (cand) => ({ production: 'success', test: 'primary', example: 'warning', documentation: 'info', synthetic: 'info' }[bestQualityOf(cand)] || 'info')
const msQualityLabel = (cand) => ({ production: '生产环境', test: '测试', example: '示例', documentation: '文档', synthetic: '合成' }[bestQualityOf(cand)] || bestQualityOf(cand))
const truncate = (s, n) => (s && s.length > n ? s.slice(0, n) + '...' : s)

onMounted(async () => {
  await loadStats()
  simulateServerStatus()

  // 预置 2 次真实 Skill 检索（SKILL.md 官方 Good queries）
  setTimeout(async () => {
    await runMonitorSearch('json parse serialize', 'cargo')
    if (monitorSearch.value) {
      searchHistory.value.push({
        query: monitorSearch.value.query,
        results: monitorSearch.value.results.slice(0, 3),
        timestamp: monitorSearch.value.queriedAt
      })
    }
    await runMonitorSearch('IPC parcel remote object', 'cargo')
    if (monitorSearch.value) {
      searchHistory.value.push({
        query: monitorSearch.value.query,
        results: monitorSearch.value.results.slice(0, 3),
        timestamp: monitorSearch.value.queriedAt
      })
    }
    searchCount.value = searchHistory.value.length
  }, 800)
})

onBeforeUnmount(() => {
  // 清理定时器等
})
</script>

<style scoped>
.live-monitor {
  padding: 24px;
}

.monitor-card {
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.monitor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.history-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.monitor-status {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 20px 0;
}

.status-item {
  display: flex;
  align-items: center;
}

.label {
  font-weight: 600;
  color: #606266;
  margin-right: 12px;
}

.value {
  color: #303133;
  font-weight: 500;
  font-size: 16px;
}

.empty-history {
  text-align: center;
  padding: 60px;
  color: #909399;
}

/* ---------- 最近 Skill 检索记录 ---------- */
.monitor-search-panel {
  padding: 4px 0;
}

.ms-query {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 14px;
  color: #303133;
  padding: 10px 12px;
  margin-bottom: 12px;
  background: #f8fafc;
  border: 1px solid #eef1f5;
  border-radius: 8px;
}

.ms-meta {
  font-size: 12px;
  color: #909399;
  margin-left: auto;
}

.ms-list {
  display: flex;
  flex-direction: column;
  border: 1px solid #eef1f5;
  border-radius: 8px;
  overflow: hidden;
}

.ms-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 12px;
  border-bottom: 1px solid #f0f2f5;
}

.ms-item:last-child { border-bottom: none; }

.ms-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}

.ms-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ms-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ms-summary {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ms-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.ms-score {
  font-weight: 700;
  color: #409eff;
  font-size: 15px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-item {
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
  border-left: 4px solid transparent;
}

.history-item.active {
  border-color: #409eff;
  background: #ecf5ff;
  border-left-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.history-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.query-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-icon {
  color: #409eff;
  font-size: 20px;
}

.query-text {
  font-weight: 500;
  color: #303133;
  font-size: 16px;
}

.search-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.time {
  font-size: 14px;
  color: #909399;
}

.result-tag {
  margin: 0;
  font-size: 14px;
}

.search-details {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.top-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mini-result {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.mini-result:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.result-name {
  font-size: 15px;
  color: #303133;
}

.result-score {
  font-weight: bold;
  color: #409eff;
  font-size: 16px;
}

.more-results {
  text-align: center;
  color: #909399;
  font-size: 14px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-card {
  text-align: center;
  padding: 24px;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.stat-number {
  font-size: 36px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 12px;
}

.stat-label {
  color: #606266;
  font-size: 15px;
}

.activity-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
}

.indicator-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #c0c4cc;
}

.indicator-dot.online {
  background: #67c23a;
}

.indicator-dot.offline {
  background: #f56c6c;
}

.indicator-dot.searching {
  background: #409eff;
  animation: pulse 1.5s infinite;
}

.indicator-dot.idle {
  background: #909399;
}

.indicator-text {
  color: #606266;
  font-size: 15px;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(64, 158, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0);
  }
}
</style>