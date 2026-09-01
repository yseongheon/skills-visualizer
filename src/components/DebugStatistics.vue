<template>
  <div class="debug-panel">
    <h2>🔍 调试统计面板</h2>

    <!-- 显示基本状态 -->
    <el-card>
      <h3>组件状态</h3>
      <p>总 API 数量: {{ totalApis }}</p>
      <p>有使用证据: {{ hasUsage }}</p>
      <p>加载状态: {{ loading ? '加载中...' : '已完成' }}</p>
      <p>错误信息: {{ error }}</p>
    </el-card>

    <!-- 统计概览 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="6">
        <el-card>
          <div class="stat-number">{{ totalApis }}</div>
          <div class="stat-label">总 API 数量</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-number">{{ hasUsage }}</div>
          <div class="stat-label">有使用证据</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-number">{{ Object.keys(sourceDistribution).length }}</div>
          <div class="stat-label">API 来源种类</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-number">{{ Object.keys(qualityDistribution).length }}</div>
          <div class="stat-label">质量等级种类</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 显示原始数据 -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <h3>原始数据调试</h3>
      </template>
      <div v-if="sampleData">
        <h4>样本数据（前3条）:</h4>
        <pre>{{ sampleData }}</pre>
      </div>
      <div v-else>
        <p>暂无数据</p>
      </div>
    </el-card>

    <!-- 简单的图表测试 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card title="API 来源分布">
          <div ref="simpleChartRef" style="height: 300px; border: 1px solid #eee; display: flex; align-items: center; justify-content: center;">
            图表加载区域
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card title="测试 ECharts">
          <div ref="testChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { KnowledgeBaseLoader } from '../utils/kb-loader'

const totalApis = ref(0)
const hasUsage = ref(0)
const loading = ref(true)
const error = ref('')
const sourceDistribution = ref({})
const qualityDistribution = ref({})
const sampleData = ref(null)

// 图表引用
const testChartRef = ref(null)
const simpleChartRef = ref(null)

// 测试图表
let testChart = null

const kbLoader = new KnowledgeBaseLoader()

// 加载数据
const loadData = async () => {
  try {
    loading.value = true
    error.value = ''

    // 尝试加载数据
    const data = await kbLoader.loadKnowledgeBase()
    console.log('数据加载成功，数量:', data.length)

    totalApis.value = data.length
    hasUsage.value = data.filter(item => item.usage && item.usage.length > 0).length

    // 计算分布
    const sourceDist = {}
    const qualityDist = {}

    // 取前5条数据作为样本
    sampleData.value = data.slice(0, 5)

    data.forEach(item => {
      const source = item.source?.source_kind || item.api_source_type || 'unknown'
      sourceDist[source] = (sourceDist[source] || 0) + 1

      if (item.usage) {
        item.usage.forEach(usage => {
          const quality = usage.quality || 'unknown'
          qualityDist[quality] = (qualityDist[quality] || 0) + 1
        })
      }
    })

    sourceDistribution.value = sourceDist
    qualityDistribution.value = qualityDist

    console.log('来源分布:', sourceDist)
    console.log('质量分布:', qualityDist)

    // 测试渲染图表
    renderCharts(sourceDist, qualityDist)

  } catch (err) {
    console.error('数据加载失败:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// 渲染图表
const renderCharts = (sourceData, qualityData) => {
  // 使用 nextTick 确保 DOM 已更新
  nextTick(() => {
    // 渲染测试图表
    if (testChartRef.value) {
      testChart = echarts.init(testChartRef.value)

      const option = {
        title: {
          text: '测试图表'
        },
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: ['A', 'B', 'C', 'D']
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          data: [10, 20, 30, 40],
          type: 'line'
        }]
      }

      testChart.setOption(option)
      console.log('测试图表渲染成功')
    }

    // 显示简单的分布信息
    if (simpleChartRef.value) {
      simpleChartRef.value.innerHTML = `
        <div style="text-align: center;">
          <h4>来源分布</h4>
          ${Object.entries(sourceData).map(([key, value]) =>
            `<p>${key}: ${value}</p>`
          ).join('')}
        </div>
      `
    }
  })
}

onMounted(() => {
  console.log('DebugStatistics 组件挂载')
  loadData()
})
</script>

<style scoped>
.debug-panel {
  padding: 20px;
}

.stat-number {
  font-size: 36px;
  font-weight: bold;
  color: #409EFF;
  text-align: center;
  margin: 20px 0 10px;
}

.stat-label {
  text-align: center;
  color: #606266;
  font-size: 14px;
}

pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 200px;
}
</style>