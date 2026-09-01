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

// 添加搜索到历史
const addToHistory = (query, results) => {
  searchHistory.value.unshift({
    query,
    results,
    timestamp: Date.now()
  })

  // 只保留最近20条记录
  if (searchHistory.value.length > 20) {
    searchHistory.value = searchHistory.value.slice(0, 20)
  }

  searchCount.value++
}

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

onMounted(async () => {
  await loadStats()
  simulateServerStatus()

  // 模拟一些搜索历史
  setTimeout(() => {
    searchHistory.value.push(
      {
        query: 'message parcel',
        results: [
          { api_name: 'MessageParcel', score: 0.95 },
          { api_name: 'ParcelReader', score: 0.87 }
        ],
        timestamp: Date.now() - 60000
      },
      {
        query: 'json serialize',
        results: [
          { api_name: 'JsonSerializer', score: 0.92 },
          { api_name: 'JsonParser', score: 0.88 }
        ],
        timestamp: Date.now() - 120000
      }
    )
  }, 1000)
})

onBeforeUnmount(() => {
  // 清理定时器等
})
</script>

<style scoped>
.live-monitor {
  padding: 20px;
}

.monitor-card {
  margin-bottom: 16px;
}

.monitor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.history-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.monitor-status {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 16px 0;
}

.status-item {
  display: flex;
  align-items: center;
}

.label {
  font-weight: 500;
  color: #606266;
  margin-right: 8px;
}

.value {
  color: #303133;
  font-weight: 500;
}

.empty-history {
  text-align: center;
  padding: 40px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
}

.history-item.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.history-item:hover {
  border-color: #409eff;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.query-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-icon {
  color: #409eff;
}

.query-text {
  font-weight: 500;
  color: #303133;
}

.search-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.time {
  font-size: 12px;
  color: #909399;
}

.result-tag {
  margin: 0;
}

.search-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e4e7ed;
}

.top-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mini-result {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #fff;
  border-radius: 4px;
}

.result-name {
  font-size: 14px;
  color: #303133;
}

.result-score {
  font-weight: bold;
  color: #409eff;
}

.more-results {
  text-align: center;
  color: #909399;
  font-size: 12px;
  padding: 8px;
}

.stat-card {
  text-align: center;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}

.activity-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.indicator-dot {
  width: 8px;
  height: 8px;
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
  font-size: 14px;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(64, 158, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0);
  }
}
</style>