<template>
  <div class="statistics-panel">
    <!-- 统计概览 -->
    <el-row :gutter="20">
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
          <div class="stat-number">{{ sourceTypes }}</div>
          <div class="stat-label">API 来源种类</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-number">{{ qualityTypes }}</div>
          <div class="stat-label">质量等级种类</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card title="API 来源分布">
          <div ref="sourceChart" style="height: 400px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card title="使用质量分布">
          <div ref="qualityChart" style="height: 400px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card title="搜索关键词分析">
          <div ref="wordCloudChart" style="height: 400px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { KnowledgeBaseLoader } from '../utils/kb-loader'

const totalApis = ref(0)
const hasUsage = ref(0)
const sourceTypes = ref(0)
const qualityTypes = ref(0)

const sourceChart = ref(null)
const qualityChart = ref(null)
const wordCloudChart = ref(null)

let sourceChartInstance = null
let qualityChartInstance = null
let wordCloudChartInstance = null

const kbLoader = new KnowledgeBaseLoader()

// 初始化图表
const initCharts = () => {
  nextTick(() => {
    if (sourceChart.value) {
      sourceChartInstance = echarts.init(sourceChart.value)
    }
    if (qualityChart.value) {
      qualityChartInstance = echarts.init(qualityChart.value)
    }
    if (wordCloudChart.value) {
      wordCloudChartInstance = echarts.init(wordCloudChart.value)
    }
  })
}

// 加载数据
const loadData = async () => {
  try {
    const data = await kbLoader.loadKnowledgeBase()
    console.log('Data loaded:', data.length)

    // 计算统计数据
    totalApis.value = data.length
    hasUsage.value = data.filter(item => item.usage && item.usage.length > 0).length

    const sourceDist = {}
    const qualityDist = {}

    data.forEach(item => {
      // 统计来源
      const source = item.source?.source_kind || item.api_source_type || 'unknown'
      sourceDist[source] = (sourceDist[source] || 0) + 1

      // 统计质量
      if (item.usage) {
        item.usage.forEach(usage => {
          const quality = usage.quality || 'unknown'
          qualityDist[quality] = (qualityDist[quality] || 0) + 1
        })
      }
    })

    sourceTypes.value = Object.keys(sourceDist).length
    qualityTypes.value = Object.keys(qualityDist).length

    console.log('Source distribution:', sourceDist)
    console.log('Quality distribution:', qualityDist)

    // 渲染图表
    renderSourceChart(sourceDist)
    renderQualityChart(qualityDist)
    renderWordCloud()
  } catch (error) {
    console.error('Failed to load data:', error)
  }
}

// 渲染来源分布图表
const renderSourceChart = (data) => {
  if (!sourceChartInstance) return

  const formattedData = Object.entries(data).map(([name, value]) => ({
    name: getSourceName(name),
    value
  }))

  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [{
      name: '来源',
      type: 'pie',
      radius: '50%',
      data: formattedData,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }

  sourceChartInstance.setOption(option)
}

// 渲染质量分布图表
const renderQualityChart = (data) => {
  if (!qualityChartInstance) return

  const categories = Object.keys(data)
  const values = Object.values(data)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: categories.map(name => getQualityName(name))
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: '数量',
      type: 'bar',
      data: categories.map((name, index) => ({
        value: values[index],
        itemStyle: {
          color: getQualityColor(name)
        }
      }))
    }]
  }

  qualityChartInstance.setOption(option)
}

// 渲染词云图
const renderWordCloud = () => {
  if (!wordCloudChartInstance) return

  const wordCloudData = [
    { name: 'message', value: 100 },
    { name: 'parcel', value: 80 },
    { name: 'json', value: 75 },
    { name: 'interface', value: 70 },
    { name: 'token', value: 65 },
    { name: 'serialize', value: 60 },
    { name: 'deserialize', value: 55 },
    { name: 'buffer', value: 50 },
    { name: 'error', value: 45 },
    { name: 'result', value: 40 }
  ]

  const option = {
    series: [{
      type: 'wordCloud',
      gridSize: 8,
      sizeRange: [12, 60],
      rotationRange: [-45, 45],
      shape: 'circle',
      width: '100%',
      height: '100%',
      textStyle: {
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
        color: function () {
          return 'rgb(' + [
            Math.round(Math.random() * 160),
            Math.round(Math.random() * 160),
            Math.round(Math.random() * 160)
          ].join(',') + ')'
        }
      },
      data: wordCloudData
    }]
  }

  wordCloudChartInstance.setOption(option)
}

// 获取来源名称
const getSourceName = (source) => {
  const sourceMap = {
    'third_party_crate': '第三方包',
    'module_rust_api': '模块 Rust API',
    'ffi_wrapper': 'FFI 封装',
    'openharmony_builtin': 'OpenHarmony 内置',
    'third_party_rust_crate': '第三方 Rust 包',
    'unknown': '未知'
  }
  return sourceMap[source] || source
}

// 获取质量名称
const getQualityName = (quality) => {
  const qualityMap = {
    'production': '生产环境',
    'test': '测试',
    'example': '示例',
    'documentation': '文档',
    'synthetic': '合成',
    'unknown': '未知'
  }
  return qualityMap[quality] || quality
}

// 获取质量颜色
const getQualityColor = (quality) => {
  const colorMap = {
    'production': '#67C23A',
    'test': '#409EFF',
    'example': '#E6A23C',
    'documentation': '#909399',
    'synthetic': '#C0C4CC',
    'unknown': '#909399'
  }
  return colorMap[quality] || '#909399'
}

// 调整图表大小
const resizeCharts = () => {
  sourceChartInstance?.resize()
  qualityChartInstance?.resize()
  wordCloudChartInstance?.resize()
}

onMounted(() => {
  initCharts()
  loadData()
  window.addEventListener('resize', resizeCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  sourceChartInstance?.dispose()
  qualityChartInstance?.dispose()
  wordCloudChartInstance?.dispose()
})
</script>

<style scoped>
.statistics-panel {
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
</style>