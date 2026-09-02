<template>
  <div class="elegant-statistics">
    <!-- 页面标题 -->
    <div class="section-header">
      <div class="title-section">
        <h2 class="main-title">📊 数据统计分析</h2>
        <p class="sub-title">基于 {{ totalApis }} 个真实 OpenHarmony Rust API 的动态分析</p>
      </div>
      <div class="action-section">
        <el-button type="primary" size="large" :icon="Refresh" :loading="loading" @click="loadData">
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 关键指标卡片 -->
    <el-row :gutter="32" class="metrics-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric-card">
          <div class="metric-icon primary">
            <el-icon size="18"><Document /></el-icon>
          </div>
          <div class="metric-content">
            <div class="metric-number">{{ totalApis }}</div>
            <div class="metric-label">总 API 数量</div>
            <div class="metric-trend">
              <span class="trend-tag">全部真实数据</span>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric-card">
          <div class="metric-icon success">
            <el-icon size="18"><Check /></el-icon>
          </div>
          <div class="metric-content">
            <div class="metric-number">{{ hasUsage }}</div>
            <div class="metric-label">有使用证据</div>
            <div class="metric-trend">
              <span class="trend-tag" :class="hasUsage === totalApis ? 'success' : 'warning'">
                {{ hasUsage === totalApis ? '100% 覆盖' : '部分覆盖' }}
              </span>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric-card">
          <div class="metric-icon info">
            <el-icon size="18"><DataLine /></el-icon>
          </div>
          <div class="metric-content">
            <div class="metric-number">{{ Object.keys(sourceDistribution).length }}</div>
            <div class="metric-label">API 来源种类</div>
            <div class="metric-trend">
              <span class="trend-tag">多样性</span>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric-card">
          <div class="metric-icon warning">
            <el-icon size="18"><TrendCharts /></el-icon>
          </div>
          <div class="metric-content">
            <div class="metric-number">{{ Object.keys(qualityDistribution).length }}</div>
            <div class="metric-label">质量等级种类</div>
            <div class="metric-trend">
              <span class="trend-tag">质量认证</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域（2×2 等宽等高，保证每个图都有充足展示空间） -->
    <el-row :gutter="24" class="charts-row">
      <el-col :xs="24" :md="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>API 来源分布</h3>
            <div class="chart-actions">
              <el-radio-group v-model="sourceChartType" size="small">
                <el-radio-button label="pie">饼图</el-radio-button>
                <el-radio-button label="bar">柱图</el-radio-button>
              </el-radio-group>
            </div>
          </div>
          <div class="chart-container">
            <div ref="sourceChartRef" class="chart"></div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :md="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>构建系统兼容性分布</h3>
          </div>
          <div class="chart-container">
            <div ref="buildChartRef" class="chart"></div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :md="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>质量分布（按使用记录）</h3>
          </div>
          <div class="chart-container">
            <div ref="qualityChartRef" class="chart"></div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :md="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>使用证据规模分布（按 API）</h3>
          </div>
          <div class="chart-container">
            <div ref="usageHistChartRef" class="chart"></div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 详细数据表格 -->
    <el-row :gutter="24" class="table-row">
      <el-col :span="24">
        <div class="table-card">
          <div class="table-header">
            <h3>API 详细信息</h3>
            <div class="table-actions">
              <el-input
                v-model="searchQuery"
                placeholder="搜索 API 名称..."
                prefix-icon="Search"
                size="small"
                style="width: 300px;"
              />
              <el-button type="primary" size="small" @click="exportData">导出数据</el-button>
            </div>
          </div>
          <div class="table-container">
            <el-table
              :data="paginatedData"
              stripe
              style="width: 100%"
              height="400"
              :loading="loading"
              @sort-change="handleSortChange"
            >
              <el-table-column prop="api_name" label="API 名称" min-width="220">
                <template #default="{ row }">
                  <el-tag :type="getApiTypeTag(row.api_source_type)" size="small">
                    {{ row.api_name }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="api_source_type" label="来源类型" width="160">
                <template #default="{ row }">
                  <span class="source-type">{{ getSourceTypeName(row.api_source_type) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="source.name" label="来源仓库" width="150">
                <template #default="{ row }">
                  {{ row.source?.name || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="使用质量" width="110">
                <template #default="{ row }">
                  <el-tag :type="getQualityTag(row.usage)" size="small">
                    {{ getQualityLabel(row.usage) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="usage" label="使用次数" width="100" sortable="custom">
                <template #default="{ row }">
                  {{ (row.usage || []).length }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" size="small" link @click="showApiDetail(row)">
                    查看详情
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="pagination-container">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="filteredData.length"
                layout="total, sizes, prev, pager, next, jumper"
                small
              />
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import echarts from '../utils/echarts'
import { ElMessageBox, ElMessage } from 'element-plus'
import { KnowledgeBaseLoader } from '../utils/kb-loader'
import { Document, Check, DataLine, TrendCharts, Refresh } from '@element-plus/icons-vue'

const kbLoader = new KnowledgeBaseLoader()

// 数据状态
const allApiData = ref([])
const loading = ref(false)
const totalApis = ref(0)
const hasUsage = ref(0)
const sourceDistribution = ref({})
const qualityDistribution = ref({})
const buildDistribution = ref({ both: 0, cargoOnly: 0, gnOnly: 0, none: 0 })
const usageHistogram = ref({})

// 图表相关
const sourceChartRef = ref(null)
const qualityChartRef = ref(null)
const buildChartRef = ref(null)
const usageHistChartRef = ref(null)
let sourceChart = null
let qualityChart = null
let buildChart = null
let usageHistChart = null
const sourceChartType = ref('pie')

// 表格相关
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const sortProp = ref('api_name')
const sortOrder = ref('ascending')

// 加载真实数据并计算所有统计
const loadData = async () => {
  loading.value = true
  try {
    const data = await kbLoader.loadKnowledgeBase()
    allApiData.value = data
    totalApis.value = data.length

    // 来源分布（按 api_source_type）
    const src = {}
    data.forEach(it => {
      const type = it.api_source_type || 'unknown'
      src[type] = (src[type] || 0) + 1
    })
    sourceDistribution.value = src

    // 使用证据 + 质量分布（按使用记录）
    let hu = 0
    const qual = {}
    data.forEach(it => {
      const usage = it.usage || []
      if (usage.length > 0) hu++
      usage.forEach(u => {
        const q = String(u.quality || 'unknown')
        qual[q] = (qual[q] || 0) + 1
      })
    })
    hasUsage.value = hu
    qualityDistribution.value = qual

    // 构建系统兼容性分布
    const bd = { both: 0, cargoOnly: 0, gnOnly: 0, none: 0 }
    data.forEach(it => {
      const cargo = it.build_support?.cargo?.supported === true
      const gn = it.build_support?.openharmony_gn?.supported === true
      if (cargo && gn) bd.both++
      else if (cargo) bd.cargoOnly++
      else if (gn) bd.gnOnly++
      else bd.none++
    })
    buildDistribution.value = bd

    // 使用证据规模分布（按 API 的 usage 条数分桶）
    const bins = { '1条': 0, '2条': 0, '3-5条': 0, '6-10条': 0, '11条+': 0 }
    data.forEach(it => {
      const n = (it.usage || []).length
      if (n === 1) bins['1条']++
      else if (n === 2) bins['2条']++
      else if (n <= 5) bins['3-5条']++
      else if (n <= 10) bins['6-10条']++
      else bins['11条+']++
    })
    usageHistogram.value = bins

    currentPage.value = 1
    renderCharts()
    ElMessage.success('数据已刷新：共 ' + data.length + ' 条真实 API')
  } catch (error) {
    console.error('加载知识库失败:', error)
    ElMessage.error('加载数据失败：' + error.message)
  } finally {
    loading.value = false
  }
}

// 等待图表容器可见（统计页在非激活标签中挂载时容器宽高为 0，
// 直接 echarts.init 会得到 0 尺寸导致图表极小且偏左上——切到本页后重试直至可见）
let renderTimer = null
const renderCharts = () => {
  const holder = sourceChartRef.value || qualityChartRef.value
  if (holder && holder.offsetWidth === 0) {
    clearTimeout(renderTimer)
    renderTimer = setTimeout(renderCharts, 150)
    return
  }

  // 来源分布
  if (sourceChartRef.value) {
    sourceChart = sourceChart || echarts.init(sourceChartRef.value)
    const sourceData = Object.entries(sourceDistribution.value).map(([name, value]) => ({
      name: getSourceTypeName(name),
      value,
      itemStyle: { borderRadius: 8 }
    }))
    sourceChart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 10,
        top: 'center',
        textStyle: { fontSize: 13 }
      },
      series: [{
        name: 'API 来源',
        type: sourceChartType.value,
        radius: sourceChartType.value === 'pie' ? ['40%', '70%'] : '60%',
        center: ['60%', '50%'],
        data: sourceData,
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' }
        }
      }]
    })
  }

  // 质量分布
  if (qualityChartRef.value) {
    qualityChart = qualityChart || echarts.init(qualityChartRef.value)
    const qualKeys = Object.keys(qualityDistribution.value)
    qualityChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '20%', containLabel: true },
      xAxis: {
        type: 'category',
        data: qualKeys.map(k => getQualityLabel(k)),
        axisLabel: { rotate: 35, fontSize: 13 }
      },
      yAxis: { type: 'value', axisLabel: { fontSize: 13 } },
      series: [{
        data: qualKeys.map(k => ({
          value: qualityDistribution.value[k],
          itemStyle: { color: getQualityColor(k) }
        })),
        type: 'bar',
        barWidth: '40%',
        radius: [0, 4]
      }]
    })
  }

  // 构建系统兼容性分布
  if (buildChartRef.value) {
    buildChart = buildChart || echarts.init(buildChartRef.value)
    const bd = buildDistribution.value
    buildChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} 个 ({d}%)' },
      legend: { orient: 'vertical', left: 10, top: 'center', textStyle: { fontSize: 13 } },
      series: [{
        name: '构建兼容性',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        data: [
          { name: 'Cargo + GN', value: bd.both, itemStyle: { color: '#16A34A' } },
          { name: '仅 Cargo', value: bd.cargoOnly, itemStyle: { color: '#3B82F6' } },
          { name: '仅 GN', value: bd.gnOnly, itemStyle: { color: '#D97706' } },
          { name: '不支持', value: bd.none, itemStyle: { color: '#DC2626' } }
        ],
        label: { formatter: '{b}\n{c} ({d}%)' }
      }]
    })
  }

  // 使用证据规模分布
  if (usageHistChartRef.value) {
    usageHistChart = usageHistChart || echarts.init(usageHistChartRef.value)
    const keys = Object.keys(usageHistogram.value)
    usageHistChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
      xAxis: {
        type: 'category',
        data: keys,
        axisLabel: { fontSize: 13 }
      },
      yAxis: { type: 'value', axisLabel: { fontSize: 13 } },
      series: [{
        data: keys.map(k => ({ value: usageHistogram.value[k], itemStyle: { color: '#3B82F6', borderRadius: [4, 4, 0, 0] } })),
        type: 'bar',
        barWidth: '45%',
        label: { show: true, position: 'top' }
      }]
    })
  }
}

// 计算属性
const filteredData = computed(() => {
  let data = [...allApiData.value]

  if (searchQuery.value) {
    data = data.filter(item =>
      item.api_name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  // 排序
  data.sort((a, b) => {
    const aVal = getSortValue(a)
    const bVal = getSortValue(b)
    if (aVal === bVal) return 0
    const order = sortOrder.value === 'ascending' ? 1 : -1
    return aVal > bVal ? order : -order
  })

  return data
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

const getSortValue = (item) => {
  if (sortProp.value === 'usage') return (item.usage || []).length
  if (sortProp.value === 'source.name') return item.source?.name || ''
  return item[sortProp.value] || ''
}

// 名称映射（对应真实数据中的 api_source_type）
const getSourceTypeName = (type) => {
  const map = {
    'third_party_rust_crate': '第三方 Rust 包',
    'openharmony_module_rust_api': 'OpenHarmony 模块 API',
    'openharmony_cpp_ffi_rust_wrapper': 'C++ FFI Rust 封装',
    'openharmony_independent_rust_crate': '独立 Rust crate',
    'third_party_crate': '第三方包',
    'module_rust_api': '模块API',
    'ffi_wrapper': 'FFI封装',
    'openharmony_builtin': '内置API'
  }
  return map[type] || type
}

const getApiTypeTag = (type) => {
  const map = {
    'third_party_rust_crate': '',
    'openharmony_module_rust_api': 'success',
    'openharmony_cpp_ffi_rust_wrapper': 'warning',
    'openharmony_independent_rust_crate': 'info',
    'third_party_crate': '',
    'module_rust_api': 'success',
    'ffi_wrapper': 'warning',
    'openharmony_builtin': 'info'
  }
  return map[type] || ''
}

// 质量权重（用于求 API 级最佳质量）
const QUALITY_WEIGHT = {
  production: 5.0,
  test: 3.0,
  example: 2.0,
  documentation: 1.5,
  crate_source: 1.2,
  synthetic: 0.5
}

// 取 usage 证据中质量权重最高的等级（API 级，而非 usage[0]）
const getBestQuality = (usage) => {
  if (!usage || usage.length === 0) return 'synthetic'
  let best = 'synthetic'
  let bestWeight = -1
  usage.forEach(u => {
    const w = QUALITY_WEIGHT[u.quality] ?? 0
    if (w > bestWeight) { bestWeight = w; best = u.quality }
  })
  return best
}

const getQualityLabel = (qualityOrUsage) => {
  const q = typeof qualityOrUsage === 'string'
    ? qualityOrUsage
    : getBestQuality(qualityOrUsage)
  const map = {
    'production': '生产环境',
    'test': '测试',
    'example': '示例',
    'documentation': '文档',
    'crate_source': '包源码',
    'synthetic': '合成'
  }
  return map[q] || q
}

const getQualityTag = (usage) => {
  const q = getBestQuality(usage)
  const map = {
    'production': 'success',
    'test': 'primary',
    'example': 'warning',
    'documentation': 'info',
    'crate_source': 'primary',
    'synthetic': 'danger'
  }
  return map[q] || 'info'
}

const getQualityColor = (quality) => {
  const map = {
    'production': '#16A34A',
    'test': '#3B82F6',
    'example': '#D97706',
    'documentation': '#6B7280',
    'crate_source': '#8B5CF6',
    'synthetic': '#DC2626'
  }
  return map[quality] || '#6B7280'
}

// 事件处理
const handleSortChange = ({ prop, order }) => {
  sortProp.value = prop
  sortOrder.value = order
}

const showApiDetail = (row) => {
  const usageHtml = (row.usage || []).slice(0, 3).map(u =>
    `<div style="margin-bottom:8px;font-size:13px;">
       <span style="color:#909399;">${u.file}:${u.line || ''}</span>
       <pre style="background:#f5f7fa;padding:6px 8px;border-radius:4px;font-size:12px;white-space:pre-wrap;">${(u.code || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
     </div>`
  ).join('')
  ElMessageBox.alert(`
    <strong>${row.api_name}</strong><br><br>
    来源类型：${getSourceTypeName(row.api_source_type)}<br>
    具体来源：${row.source?.name || '无'}<br>
    使用次数：${(row.usage || []).length}<br>
    质量等级：${getQualityLabel(row.usage?.[0]?.quality || 'unknown')}<br><br>
    <div style="max-height:200px;overflow:auto;">${usageHtml}</div>
  `, 'API 详情', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '确定'
  })
}

// 导出 CSV
const exportData = () => {
  const header = ['API名称', '来源类型', '来源仓库', '使用次数', '功能摘要']
  const rows = allApiData.value.map(it => [
    it.api_name,
    getSourceTypeName(it.api_source_type),
    it.source?.name || '',
    (it.usage || []).length,
    (it.function_summary || '').replace(/[\n,]/g, ' ')
  ])
  const csv = [header, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'knowledge-base.csv'
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('已导出 ' + allApiData.value.length + ' 条数据')
}

// 生命周期
onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
  watch(sourceChartType, () => renderCharts())
  // 观察图表容器：切标签页显示/隐藏后自动恢复图表尺寸
  requestAnimationFrame(() => {
    if (sourceChartRef.value) ro?.observe(sourceChartRef.value)
    if (qualityChartRef.value) ro?.observe(qualityChartRef.value)
    if (buildChartRef.value) ro?.observe(buildChartRef.value)
    if (usageHistChartRef.value) ro?.observe(usageHistChartRef.value)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  clearTimeout(renderTimer)
  ro?.disconnect()
  sourceChart?.dispose()
  qualityChart?.dispose()
  buildChart?.dispose()
  usageHistChart?.dispose()
})

const handleResize = () => {
  sourceChart?.resize()
  qualityChart?.resize()
  buildChart?.resize()
  usageHistChart?.resize()
}

// ResizeObserver：标签页切换显示/隐藏导致容器尺寸变化时同步图表（含切回本页场景）
let ro = null
if (typeof ResizeObserver !== 'undefined') {
  ro = new ResizeObserver(() => handleResize())
}

// 搜索或改每页条数时回到第一页，避免出现空白页
watch(searchQuery, () => {
  currentPage.value = 1
})
</script>

<style scoped>
.elegant-statistics {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 20px);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.title-section {
  flex: 1;
}

.main-title {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 6px 0;
}

.sub-title {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.action-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.metrics-row {
  margin-bottom: 4px;
}

.metric-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
  border: 1px solid #e8ecf1;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.metric-icon {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  font-size: 18px;
}

.metric-icon.primary {
  background: #409eff;
}

.metric-icon.success {
  background: #67c23a;
}

.metric-icon.info {
  background: #909399;
}

.metric-icon.warning {
  background: #e6a23c;
}

.metric-content {
  flex: 1;
  min-width: 0;
}

.metric-number {
  font-size: 30px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
  margin-bottom: 6px;
}

.metric-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.metric-trend {
  font-size: 12px;
}

.trend-tag {
  padding: 4px 12px;
  border-radius: 12px;
  background: #f8f9fa;
  color: #606266;
  display: inline-block;
  font-size: 12px;
  font-weight: 500;
}

.trend-tag.success {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.trend-tag.warning {
  background: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.charts-row {
  margin-bottom: 0;
}

.chart-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e8ecf1;
  overflow: hidden;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.chart-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.chart-header {
  padding: 14px 20px;
  background: #fafbfc;
  border-bottom: 1px solid #eef1f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.chart-actions {
  display: flex;
  gap: 10px;
}

.chart-container {
  padding: 20px 24px 24px;
  height: 460px;
}

.chart {
  width: 100%;
  height: 100%;
}

.table-row {
  margin-top: 4px;
}

.table-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e8ecf1;
  overflow: hidden;
}

.table-header {
  padding: 14px 20px;
  background: #fafbfc;
  border-bottom: 1px solid #eef1f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.table-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.table-container {
  padding: 16px 20px 20px;
}

.source-type {
  font-size: 14px;
  color: #606266;
}

.pagination-container {
  padding: 20px 0;
  display: flex;
  justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 20px;
    align-items: flex-start;
  }

  .action-section {
    margin-left: 0;
  }

  .metric-card {
    flex-direction: column;
    text-align: center;
  }

  .chart-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .chart-container {
    height: 360px;
  }

  .chart-card {
    min-height: 360px;
  }

  .table-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .table-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
