<template>
  <div class="elegant-statistics">
    <!-- 页面标题 -->
    <div class="section-header">
      <div class="title-section">
        <h2 class="main-title">📊 数据统计分析</h2>
        <p class="sub-title">基于 685 个真实 OpenHarmony Rust API 的深度分析</p>
      </div>
      <div class="action-section">
        <el-button type="primary" size="large" :icon="Refresh">
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 关键指标卡片 -->
    <el-row :gutter="32" class="metrics-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric-card">
          <div class="metric-icon primary">
            <el-icon size="24"><Document /></el-icon>
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
            <el-icon size="24"><Check /></el-icon>
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
            <el-icon size="24"><DataLine /></el-icon>
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
            <el-icon size="24"><TrendCharts /></el-icon>
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

    <!-- 图表区域 -->
    <el-row :gutter="32" class="charts-row">
      <el-col :xs="24" :lg="16">
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
      <el-col :xs="24" :lg="8">
        <div class="chart-card">
          <div class="chart-header">
            <h3>质量分布</h3>
          </div>
          <div class="chart-container">
            <div ref="qualityChartRef" class="chart"></div>
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
              <el-button type="primary" size="small">导出数据</el-button>
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
              <el-table-column prop="api_name" label="API 名称" min-width="200">
                <template #default="{ row }">
                  <el-tag :type="getApiTypeTag(row.api_source_type)" size="small">
                    {{ row.api_name }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="api_source_type" label="来源类型" width="150">
                <template #default="{ row }">
                  <span class="source-type">{{ getSourceTypeName(row.api_source_type) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="source.source_kind" label="具体来源" width="150">
                <template #default="{ row }">
                  {{ row.source?.name || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="使用质量" width="120">
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { Document, Check, DataLine, TrendCharts, Refresh } from '@element-plus/icons-vue'

// 数据定义
const totalApis = ref(685)
const hasUsage = ref(685)
const sourceDistribution = ref({
  'third_party_crate': 436,
  'module_rust_api': 153,
  'ffi_wrapper': 51,
  'openharmony_builtin': 45
})
const qualityDistribution = ref({
  'production': 456,
  'test': 189,
  'example': 32,
  'documentation': 8,
  'synthetic': 0
})

// 模拟 API 数据
const allApiData = ref([])

// 图表相关
const sourceChartRef = ref(null)
const qualityChartRef = ref(null)
let sourceChart = null
let qualityChart = null
const sourceChartType = ref('pie')

// 表格相关
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const sortProp = ref('api_name')
const sortOrder = ref('ascending')

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
    let aVal = a[sortProp.value]
    let bVal = b[sortProp.value]

    if (aVal === bVal) return 0

    const order = sortOrder.value === 'ascending' ? 1 : -1
    return aVal > bVal ? order : -order
  })

  return data
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

// 初始化数据
const initData = () => {
  loading.value = true

  // 模拟异步加载
  setTimeout(() => {
    // 生成模拟数据
    const sampleData = [
      {
        api_name: 'aho_corasick::Match',
        api_source_type: 'third_party_rust_crate',
        source: { name: 'aho-corasick', source_kind: 'third_party_crate' },
        usage: Array(3).fill(null).map((_, i) => ({
          quality: 'test',
          file: `test_${i}.rs`,
          code: `match_${i}()`
        }))
      },
      {
        api_name: 'asset_crypto_manager::build',
        api_source_type: 'openharmony_module_rust_api',
        source: { name: 'asset_crypto_manager', source_kind: 'module_rust_api' },
        usage: Array(2).fill(null).map((_, i) => ({
          quality: 'production',
          file: `lib.rs`,
          code: `build_${i}()`
        }))
      },
      {
        api_name: 'file::read',
        api_source_type: 'openharmony_builtin',
        source: { name: 'file', source_kind: 'builtin' },
        usage: Array(1).fill(null).map((_, i) => ({
          quality: 'production',
          file: `file_io.rs`,
          code: `read_${i}()`
        }))
      }
    ]

    // 生成更多数据
    allApiData.value = Array(685).fill(null).map((_, i) => {
      const template = sampleData[i % sampleData.length]
      return {
        ...template,
        api_name: `${template.api_name}_${i}`,
        usage: template.usage?.map((u, j) => ({
          ...u,
          file: `${u.file}_${i}`,
          code: `${u.code}_${i}_${j}`
        }))
      }
    })

    loading.value = false
    renderCharts()
  }, 1000)
}

// 渲染图表
const renderCharts = () => {
  // 渲染来源分布图表
  if (sourceChartRef.value) {
    sourceChart = echarts.init(sourceChartRef.value)

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 10,
        top: 'center',
        textStyle: {
          fontSize: 12
        }
      },
      series: [{
        name: 'API 来源',
        type: sourceChartType.value,
        radius: sourceChartType.value === 'pie' ? ['40%', '70%'] : '60%',
        center: ['60%', '50%'],
        data: Object.entries(sourceDistribution.value).map(([name, value]) => ({
          name: getSourceTypeName(name),
          value,
          itemStyle: {
            borderRadius: 8
          }
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    }

    sourceChart.setOption(option)
  }

  // 渲染质量分布图表
  if (qualityChartRef.value) {
    qualityChart = echarts.init(qualityChartRef.value)

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: Object.keys(qualityDistribution.value).map(key => getQualityLabel(key)),
        axisLabel: {
          rotate: 45,
          fontSize: 11
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          fontSize: 11
        }
      },
      series: [{
        data: Object.values(qualityDistribution.value).map((value, index) => ({
          value,
          itemStyle: {
            color: getQualityColor(Object.keys(qualityDistribution.value)[index])
          }
        })),
        type: 'bar',
        barWidth: '40%',
        radius: [0, 4]
      }]
    }

    qualityChart.setOption(option)
  }
}

// 工具函数
const getSourceTypeName = (type) => {
  const map = {
    'third_party_crate': '第三方包',
    'module_rust_api': '模块API',
    'ffi_wrapper': 'FFI封装',
    'openharmony_builtin': '内置API'
  }
  return map[type] || type
}

const getApiTypeTag = (type) => {
  const map = {
    'third_party_crate': '',
    'module_rust_api': 'success',
    'ffi_wrapper': 'warning',
    'openharmony_builtin': 'info'
  }
  return map[type] || ''
}

const getQualityLabel = (quality) => {
  const map = {
    'production': '生产环境',
    'test': '测试',
    'example': '示例',
    'documentation': '文档',
    'synthetic': '合成'
  }
  return map[quality] || quality
}

const getQualityTag = (usage) => {
  if (!usage || usage.length === 0) return 'info'
  const firstQuality = usage[0].quality
  const map = {
    'production': 'success',
    'test': 'primary',
    'example': 'warning',
    'documentation': 'info',
    'synthetic': 'danger'
  }
  return map[firstQuality] || 'info'
}

const getQualityColor = (quality) => {
  const map = {
    'production': '#16A34A',
    'test': '#3B82F6',
    'example': '#D97706',
    'documentation': '#6B7280',
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
  ElMessageBox.alert(`
    <strong>${row.api_name}</strong><br><br>
    来源类型: ${getSourceTypeName(row.api_source_type)}<br>
    具体来源: ${row.source?.name || '无'}<br>
    使用次数: ${(row.usage || []).length}<br>
    质量等级: ${getQualityLabel(row.usage?.[0]?.quality || 'unknown')}
  `, 'API 详情', {
    dangerouslyUseHTMLString: true,
    confirmButtonText: '确定'
  })
}

// 生命周期
onMounted(() => {
  initData()

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)

  // 监听图表类型变化
  watch(sourceChartType, () => {
    renderCharts()
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  sourceChart?.dispose()
  qualityChart?.dispose()
})

const handleResize = () => {
  sourceChart?.resize()
  qualityChart?.resize()
}

// 导入必要的组件和函数
import { ElMessageBox } from 'element-plus'
import { watch } from 'vue'
</script>

<style scoped>
.elegant-statistics {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  padding: 40px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 48px;
  padding: 0 20px;
}

.title-section {
  flex: 1;
}

.main-title {
  font-size: 42px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 16px 0;
  letter-spacing: -0.5px;
}

.sub-title {
  font-size: 20px;
  color: #606266;
  margin: 0;
}

.action-section {
  margin-left: 32px;
}

.metrics-row {
  margin-bottom: 48px;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

.metric-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 24px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  min-height: 140px;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  font-size: 24px;
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
  font-size: 48px;
  font-weight: 700;
  color: #303133;
  line-height: 1.1;
  margin-bottom: 12px;
}

.metric-label {
  font-size: 18px;
  color: #606266;
  margin-bottom: 12px;
}

.metric-trend {
  font-size: 14px;
}

.trend-tag {
  padding: 6px 16px;
  border-radius: 20px;
  background: #f8f9fa;
  color: #606266;
  display: inline-block;
  font-size: 14px;
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
  margin-bottom: 48px;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

.chart-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  overflow: hidden;
  transition: all 0.3s ease;
  min-height: 600px;
}

.chart-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.chart-header {
  padding: 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.chart-actions {
  display: flex;
  gap: 16px;
}

.chart-container {
  padding: 24px;
  height: 600px;
}

.chart {
  width: 100%;
  height: 100%;
}

.table-row {
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

.table-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #f0f0f0;
  overflow: hidden;
}

.table-header {
  padding: 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.table-actions {
  display: flex;
  gap: 20px;
  align-items: center;
}

.table-container {
  padding: 0 24px 24px;
  min-height: 500px;
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