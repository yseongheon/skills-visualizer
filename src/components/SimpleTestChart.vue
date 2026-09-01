<template>
  <div class="simple-chart">
    <div class="chart-header">
      <h2>📊 数据统计分析</h2>
      <p class="chart-subtitle">基于 685 个真实 OpenHarmony Rust API 的统计分析</p>
    </div>

    <el-row :gutter="24" class="chart-container">
      <el-col :span="24">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">API 使用趋势分析</span>
              <el-tag type="success" size="small" v-if="status.includes('成功')">实时更新</el-tag>
            </div>
          </template>
          <div class="chart-wrapper">
            <div ref="chartRef" class="chart-canvas"></div>
          </div>
          <div class="chart-status">
            <el-alert
              :title="status"
              :type="status.includes('错误') ? 'error' : 'success'"
              :closable="false"
              show-icon
              size="small"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 统计概览 -->
    <el-row :gutter="24" class="stats-row" style="margin-top: 24px;">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon">
            <el-icon size="24"><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">685</div>
            <div class="stat-label">总 API 数量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon">
            <el-icon size="24"><Check /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">685</div>
            <div class="stat-label">有使用证据</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon">
            <el-icon size="24"><DataLine /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">4</div>
            <div class="stat-label">API 来源种类</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon">
            <el-icon size="24"><TrendCharts /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">6</div>
            <div class="stat-label">质量等级种类</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { Document, Check, DataLine, TrendCharts } from '@element-plus/icons-vue'

const chartRef = ref(null)
const status = ref('准备中...')
let chart = null

onMounted(() => {
  status.value = '正在初始化图表...'

  // 使用 nextTick 确保 DOM 已渲染
  setTimeout(() => {
    try {
      if (chartRef.value) {
        chart = echarts.init(chartRef.value)
        status.value = '图表初始化成功'

        // 更美观的测试数据
        const option = {
          title: {
            text: 'API 使用趋势分析',
            left: 'center',
            top: 10,
            textStyle: {
              fontSize: 20,
              fontWeight: 600,
              color: '#303133'
            }
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            },
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#e4e7ed',
            borderWidth: 1,
            textStyle: {
              color: '#303133'
            }
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '60px',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: ['第三方包', '模块API', 'FFI封装', '内置API'],
            axisLine: {
              lineStyle: {
                color: '#999'
              }
            },
            axisLabel: {
              color: '#606266',
              fontSize: 12
            }
          },
          yAxis: {
            type: 'value',
            name: 'API 数量',
            nameTextStyle: {
              color: '#606266',
              fontSize: 12
            },
            axisLine: {
              lineStyle: {
                color: '#999'
              }
            },
            splitLine: {
              lineStyle: {
                type: 'dashed',
                color: '#e4e7ed'
              }
            },
            axisLabel: {
              color: '#606266',
              fontSize: 12
            }
          },
          series: [{
            name: 'API 数量',
            type: 'bar',
            barWidth: '40%',
            data: [436, 153, 51, 45],
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: '#409EFF'
                },
                {
                  offset: 1,
                  color: '#69c0ff'
                }
              ]),
              borderRadius: [8, 8, 0, 0]
            },
            emphasis: {
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  {
                    offset: 0,
                    color: '#66b1ff'
                  },
                  {
                    offset: 1,
                    color: '#85d0ff'
                  }
                ])
              }
            }
          }]
        }

        chart.setOption(option)
        status.value = '图表渲染成功'

        // 监听窗口大小变化
        window.addEventListener('resize', handleResize)
      } else {
        status.value = '错误：找不到图表容器'
      }
    } catch (error) {
      console.error('图表初始化失败:', error)
      status.value = '错误：' + error.message
    }
  }, 200)
})

// 处理窗口大小变化
const handleResize = () => {
  chart?.resize()
}

// 组件卸载时清理
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})
</script>

<style scoped>
.simple-chart {
  padding: 0;
}

.chart-header {
  margin-bottom: 32px;
  text-align: center;
}

.chart-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 8px 0;
}

.chart-subtitle {
  font-size: 16px;
  color: #909399;
  margin: 0;
}

.chart-container {
  margin-bottom: 32px;
}

.chart-card {
  border-radius: 12px;
  border: none;
  transition: all 0.3s ease;
}

.chart-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.chart-wrapper {
  padding: 20px 0;
}

.chart-canvas {
  width: 100%;
  height: 400px;
}

.chart-status {
  margin-top: 16px;
}

.stats-row {
  margin-top: 32px;
}

.stat-card {
  border-radius: 12px;
  border: none;
  transition: all 0.3s ease;
  height: 100%;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #409EFF 0%, #69c0ff 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: white;
}

.stat-content {
  text-align: center;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}
</style>