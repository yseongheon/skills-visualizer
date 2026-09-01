<template>
  <div class="statistics-panel">
    <!-- 统计概览 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card>
          <div class="stat-number">{{ statistics.totalApis }}</div>
          <div class="stat-label">总 API 数量</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-number">{{ statistics.hasUsage || 0 }}</div>
          <div class="stat-label">有使用证据</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-number">{{ Object.keys(statistics.sourceDistribution || {}).length }}</div>
          <div class="stat-label">API 来源种类</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-number">{{ Object.keys(statistics.qualityDistribution || {}).length }}</div>
          <div class="stat-label">质量等级种类</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card title="API 来源分布">
          <div id="sourceChart" style="height: 400px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card title="使用质量分布">
          <div id="qualityChart" style="height: 400px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card title="搜索关键词分析">
          <div id="wordCloudChart" style="height: 400px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { KnowledgeBaseLoader } from '../utils/kb-loader'
import { Scorer } from '../utils/scoring'

const statistics = ref({
  totalApis: 0,
  hasUsage: 0,
  noUsage: 0,
  sourceDistribution: {},
  qualityDistribution: {},
  usageDistribution: {}
})

let sourceChart = null
let qualityChart = null
let wordCloudChart = null
const kbLoader = new KnowledgeBaseLoader()

// 初始化图表
const initCharts = () => {
  // 确保容器存在
  setTimeout(() => {
    const sourceContainer = document.querySelector('#sourceChart')
    const qualityContainer = document.querySelector('#qualityChart')
    const wordCloudContainer = document.querySelector('#wordCloudChart')

    if (sourceContainer) {
      sourceChart = echarts.init(sourceContainer)
    }
    if (qualityContainer) {
      qualityChart = echarts.init(qualityContainer)
    }
    if (wordCloudContainer) {
      wordCloudChart = echarts.init(wordCloudContainer)
    }
  }, 100)
}

// 加载数据
const loadData = async () => {
  try {
    // 加载统计数据
    const stats = await kbLoader.getStatistics()
    statistics.value = {
      ...stats,
      hasUsage: stats.usageDistribution?.hasUsage || 0,
      noUsage: stats.usageDistribution?.noUsage || 0
    }

    // 渲染图表
    renderSourceChart(stats.sourceDistribution)
    renderQualityChart(stats.qualityDistribution)
    renderWordCloud()
  } catch (error) {
    console.error('Failed to load statistics:', error)
  }
}

// 渲染来源分布图表
const renderSourceChart = (data) => {
  const option = {
    title: {
      text: 'API 来源分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '来源',
        type: 'pie',
        radius: '50%',
        data: Object.entries(data).map(([name, value]) => ({
          name: getSourceName(name),
          value
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  sourceChart.setOption(option)
}

// 渲染质量分布图表
const renderQualityChart = (data) => {
  const option = {
    title: {
      text: '使用质量分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: Object.entries(data).map(([name, value]) => ({
        value: name,
        name: getQualityName(name)
      }))
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '数量',
        type: 'bar',
        data: Object.entries(data).map(([name, value]) => ({
          value,
          itemStyle: {
            color: getQualityColor(name)
          }
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  qualityChart.setOption(option)
}

// 渲染词云图
const renderWordCloud = () => {
  // 模拟词云数据
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
    { name: 'result', value: 40 },
    { name: 'data', value: 35 },
    { name: 'stream', value: 30 },
    { name: 'reader', value: 25 },
    { name: 'writer', value: 20 }
  ]

  const option = {
    title: {
      text: '常见搜索关键词',
      left: 'center'
    },
    tooltip: {
      show: true
    },
    series: [
      {
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
      }
    ]
  }
  wordCloudChart.setOption(option)
}

// 获取来源名称
const getSourceName = (source) => {
  const sourceMap = {
    'third_party_crate': '第三方包',
    'module_rust_api': '模块 Rust API',
    'ffi_wrapper': 'FFI 封装',
    'openharmony_builtin': 'OpenHarmony 内置'
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
    'synthetic': '合成'
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
    'synthetic': '#C0C4CC'
  }
  return colorMap[quality] || '#909399'
}

// 调整图表大小
const resizeCharts = () => {
  sourceChart?.resize()
  qualityChart?.resize()
  wordCloudChart?.resize()
}

onMounted(() => {
  initCharts()
  loadData()
  window.addEventListener('resize', resizeCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  sourceChart?.dispose()
  qualityChart?.dispose()
  wordCloudChart?.dispose()
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