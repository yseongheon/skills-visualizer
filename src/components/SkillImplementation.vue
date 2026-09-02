<template>
  <div class="implementation-details">
    <!-- 评分算法可视化 -->
    <el-card class="algorithm-section">
      <template #header>
        <div class="card-header">
          <h3>评分算法详解</h3>
          <el-tag type="info">RAG 的核心机制</el-tag>
        </div>
      </template>

      <!-- 真实检索流程说明 -->
      <div class="hybrid-note">
        <el-alert
          title="检索与评估流程（与 ReqTrans 真实 Skill 实现一致）："
          type="info"
          :closable="false"
          show-icon
        >
          <div class="hybrid-layers">
            <div class="layer"><el-tag size="small" type="primary">① 功能查询</el-tag> 按行为关键词检索（SKILL 指导），而非仅符号名</div>
            <div class="layer"><el-tag size="small" type="success">② 构建硬过滤</el-tag> 评分前先检查 build_support：cargo / openharmony_gn supported</div>
            <div class="layer"><el-tag size="small">③ 四维评分</el-tag> 下方公式：摘要×7 + API名×3 + 来源×1.5 + 证据×1.2，另加质量分与来源分</div>
            <div class="layer"><el-tag size="small" type="warning">④ 人工评估</el-tag> 按 candidate_evaluation.md 核验并给出 accept / reject / uncertain</div>
          </div>
        </el-alert>
      </div>

      <!-- 评分公式展示 -->
      <div class="formula-display">
        <h4>评分公式（与 search_openharmony_rust_api_kb.py 一致）：</h4>
        <div class="formula">
          总评分 =
          <el-input-number
            v-model="weights.summary"
            :min="0"
            :max="10"
            :step="0.1"
            size="small"
          /> × summary
          <span class="operator">+</span>
          <el-input-number
            v-model="weights.api"
            :min="0"
            :max="10"
            :step="0.1"
            size="small"
          /> × api
          <span class="operator">+</span>
          <el-input-number
            v-model="weights.source"
            :min="0"
            :max="10"
            :step="0.1"
            size="small"
          /> × source
          <span class="operator">+</span>
          <el-input-number
            v-model="weights.usage"
            :min="0"
            :max="10"
            :step="0.1"
            size="small"
          /> × usage
        </div>
        <p class="formula-note">
          可拖动权重实时观察评分变化；完整链路见「RAG 流程可视化」标签页
        </p>
      </div>

      <!-- 实时计算结果 -->
      <div class="calculation-demo">
        <h4>计算示例：</h4>
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="example-api">
              <h5>示例 API：</h5>
              <pre>{{ selectedApi.api_name }}</pre>
              <p>{{ selectedApi.function_summary }}</p>
            </div>
          </el-col>
          <el-col :span="18">
            <div class="score-breakdown">
              <h5>评分分解：</h5>
              <div class="score-items">
                <div
                  v-for="(score, field) in calculationDetails"
                  :key="field"
                  class="score-item"
                >
                  <div class="field-info">
                    <span class="field-name">{{ getFieldLabel(field) }}</span>
                    <span class="field-value">{{ getFieldText(selectedApi, field) }}</span>
                  </div>
                  <div class="field-score">
                    <span class="score-text">{{ score.toFixed(3) }}</span>
                    <el-progress
                      :percentage="calculatePercentage(score, totalScore)"
                      :format="scoreFormat"
                    />
                  </div>
                </div>
                <div class="total-score">
                  <span class="total-label">总评分：</span>
                  <span class="total-value">{{ totalScore.toFixed(3) }}</span>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 构建兼容性检查 -->
    <el-card class="build-section">
      <template #header>
        <div class="card-header">
          <h3>构建兼容性检查</h3>
          <el-tag type="success">关键约束条件</el-tag>
        </div>
      </template>

      <el-tabs v-model="activeBuildTab">
        <el-tab-pane label="Cargo" name="cargo">
          <div class="cargo-demo">
            <h4>Cargo 依赖示例：</h4>
            <el-alert
              title="Cargo.toml 配置"
              type="info"
              :closable="false"
              class="config-alert"
            >
              <pre>{{ cargoExample }}</pre>
            </el-alert>

            <div class="checklist">
              <h4>检查清单：</h4>
              <el-checkbox-group v-model="cargoChecklist">
                <el-row>
                  <el-col :span="12">
                    <el-checkbox label="supported">supported = true</el-checkbox>
                  </el-col>
                  <el-col :span="12">
                    <el-checkbox label="dependencies">dependencies_toml 存在</el-checkbox>
                  </el-col>
                  <el-col :span="12">
                    <el-checkbox label="version">版本兼容</el-checkbox>
                  </el-col>
                  <el-col :span="12">
                    <el-checkbox label="path">本地路径依赖可用</el-checkbox>
                  </el-col>
                </el-row>
              </el-checkbox-group>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="OpenHarmony GN" name="gn">
          <div class="gn-demo">
            <h4>GN 构建目标示例：</h4>
            <el-alert
              title="BUILD.gn 配置"
              type="info"
              :closable="false"
              class="config-alert"
            >
              <pre>{{ gnExample }}</pre>
            </el-alert>

            <div class="checklist">
              <h4>检查清单：</h4>
              <el-checkbox-group v-model="gnChecklist">
                <el-row>
                  <el-col :span="12">
                    <el-checkbox label="supported">supported = true</el-checkbox>
                  </el-col>
                  <el-col :span="12">
                    <el-checkbox label="targets">build_targets 存在</el-checkbox>
                  </el-col>
                  <el-col :span="12">
                    <el-checkbox label="external">external_deps 为空</el-checkbox>
                  </el-col>
                  <el-col :span="12">
                    <el-checkbox label="bundle">bundle_components 正确</el-checkbox>
                  </el-col>
                </el-row>
              </el-checkbox-group>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 使用证据评估 -->
    <el-card class="evidence-section">
      <template #header>
        <div class="card-header">
          <h3>使用证据评估</h3>
          <el-tag type="warning">质量权重体系</el-tag>
        </div>
      </template>

      <div class="evidence-grid">
        <div class="evidence-types">
          <h4>质量等级权重：</h4>
          <div class="evidence-table">
            <div
              v-for="(weight, quality) in qualityWeights"
              :key="quality"
              class="evidence-item"
              :class="quality"
            >
              <span class="quality-label">{{ quality }}</span>
              <el-progress
                :percentage="weight / 5 * 100"
                :color="getQualityColor(quality)"
              />
              <span class="weight-value">权重: {{ weight }}</span>
            </div>
          </div>
        </div>

        <div class="evidence-examples">
          <h4>证据展示格式：</h4>
          <div class="evidence-cards">
            <div class="evidence-card">
              <el-tag type="success" size="small">production</el-tag>
              <div class="evidence-code">
                <code>foundation/abilitybase/ipc/src/ipc_manager.rs:256</code>
                <pre>parcel.write_interface_token("test_token");</pre>
              </div>
              <div class="evidence-note">
                最高权重，来自生产环境实际使用
              </div>
            </div>

            <div class="evidence-card">
              <el-tag type="primary" size="small">test</el-tag>
              <div class="evidence-code">
                <code>applications/tests/ipc_test.rs:45</code>
                <pre>assert!(parcel.write_interface_token("test").is_ok());</pre>
              </div>
              <div class="evidence-note">
                测试用例，验证 API 可用性
              </div>
            </div>

            <div class="evidence-card">
              <el-tag type="warning" size="small">example</el-tag>
              <div class="evidence-code">
                <code>examples/demo_ipc.rs:12</code>
                <pre>let mut parcel = MessageParcel::new();</pre>
              </div>
              <div class="evidence-note">
                示例代码，展示基本用法
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 实时演示 -->
    <el-card class="demo-section">
      <template #header>
        <div class="card-header">
          <h3>实时演示</h3>
          <el-button type="primary" @click="runDemo" :loading="demoRunning">
            运行演示
          </el-button>
        </div>
      </template>

      <div v-if="demoRunning" class="demo-loading">
        <el-skeleton :rows="3" animated />
        <p>正在计算评分...</p>
      </div>

      <div v-else-if="demoResults.length > 0" class="demo-results">
        <h4>演示结果：</h4>
        <el-table :data="demoResults" stripe>
          <el-table-column prop="api_name" label="API" />
          <el-table-column prop="score" label="评分">
            <template #default="scope">
              {{ scope.row.score.toFixed(3) }}
            </template>
          </el-table-column>
          <el-table-column prop="summary_score" label="摘要分">
            <template #default="scope">
              {{ scope.row.summary_score.toFixed(3) }}
            </template>
          </el-table-column>
          <el-table-column prop="api_score" label="API名分">
            <template #default="scope">
              {{ scope.row.api_score.toFixed(3) }}
            </template>
          </el-table-column>
          <el-table-column prop="source_score" label="来源分">
            <template #default="scope">
              {{ scope.row.source_score.toFixed(3) }}
            </template>
          </el-table-column>
          <el-table-column prop="usage_score" label="使用分">
            <template #default="scope">
              {{ scope.row.usage_score.toFixed(3) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 权重配置
const weights = ref({
  summary: 7.0,
  api: 3.0,
  source: 1.5,
  usage: 1.2
})

// 质量权重
const qualityWeights = {
  production: 5.0,
  test: 3.0,
  example: 2.0,
  documentation: 1.5,
  synthetic: 0.5,
  crate_source: 1.2
}

// 检查清单
const cargoChecklist = ref(['supported'])
const gnChecklist = ref(['supported', 'targets'])

// 演示相关
const demoRunning = ref(false)
const demoResults = ref([])

// 示例 API
const selectedApi = ref({
  api_name: "ohos::message_parcel::MessageParcel",
  function_summary: "MessageParcel is a type for message parcel; it appears in OpenHarmony Rust code as a reusable data structure, enum, error type, or builder/input type.",
  source: {
    name: "ohos-message-parcel",
    source_kind: "openharmony_builtin"
  },
  usage: [
    { quality: "production" },
    { quality: "test" }
  ]
})

// 计算详情
const calculationDetails = computed(() => {
  const mockScores = {
    summary: 0.856 * weights.value.summary,
    api: 0.428 * weights.value.api,
    source: 0.214 * weights.value.source,
    usage: 0.171 * weights.value.usage
  }
  return mockScores
})

// 总评分
const totalScore = computed(() => {
  return Object.values(calculationDetails.value).reduce((sum, score) => sum + score, 0)
})

// 活动的构建系统标签
const activeBuildTab = ref('cargo')

// Cargo 示例
const cargoExample = `# Cargo.toml
[dependencies]
ohos-message-parcel = "0.1.0"

# 或者本地路径
ohos-message-parcel = { path = "../foundation/abilitybase/message_parcel" }`

// GN 示例
const gnExample = `# BUILD.gn
import("//foundation/abilitybase/message_parcel/message_parcel.gni")

ohos_sample_app("demo_app") {
  deps = [
    "//foundation/abilitybase/message_parcel:lib",
  ]
}`

// 计算百分比
const calculatePercentage = (score, total) => {
  return total > 0 ? Math.round((score / total) * 100) : 0
}

// 格式化分数显示
const scoreFormat = (val) => {
  return val.toFixed(1)
}

// 获取字段标签
const getFieldLabel = (field) => {
  const labels = {
    summary: '摘要匹配',
    api: 'API名称',
    source: '来源信息',
    usage: '使用证据'
  }
  return labels[field] || field
}

// 获取字段文本
const getFieldText = (api, field) => {
  if (field === 'summary') {
    return api.function_summary.substring(0, 50) + '...'
  }
  if (field === 'api') {
    return api.api_name
  }
  if (field === 'source') {
    return api.source?.source_kind || '未知'
  }
  if (field === 'usage') {
    return api.usage?.length || 0
  }
  return ''
}

// 获取质量颜色
const getQualityColor = (quality) => {
  const colorMap = {
    production: '#67C23A',
    test: '#409EFF',
    example: '#E6A23C',
    documentation: '#909399'
  }
  return colorMap[quality] || '#C0CCDA'
}

// 运行演示
const runDemo = async () => {
  demoRunning.value = true

  // 模拟计算过程
  await new Promise(resolve => setTimeout(resolve, 2000))

  // 生成演示结果
  demoResults.value = [
    {
      api_name: "MessageParcel",
      score: 0.856,
      summary_score: 0.856,
      api_score: 0.428,
      source_score: 0.214,
      usage_score: 0.171
    },
    {
      api_name: "JsonValue",
      score: 0.723,
      summary_score: 0.723,
      api_score: 0.361,
      source_score: 0.181,
      usage_score: 0.144
    }
  ]

  demoRunning.value = false
}

// 监听权重变化
const watchWeights = () => {
  // 权重变化时重新计算
  console.log('权重已更新:', weights.value)
}
</script>

<style scoped>
.implementation-details {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
}

.hybrid-note {
  margin-bottom: 20px;
}

.hybrid-layers {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
}

.layer {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.layer .el-tag {
  flex-shrink: 0;
  min-width: 76px;
  text-align: center;
}

.formula-note {
  margin: 0 0 4px;
  font-size: 12px;
  color: #909399;
}

.formula {
  background: #F5F7FA;
  padding: 20px;
  border-radius: 8px;
  margin: 16px 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.operator {
  margin: 0 8px;
  font-weight: bold;
  color: #409EFF;
}

.el-input-number {
  width: 80px;
}

.calculation-demo {
  margin-top: 20px;
}

.example-api {
  background: #F8F9FA;
  padding: 15px;
  border-radius: 8px;
}

.example-api h5 {
  margin: 0 0 10px 0;
  color: #303133;
}

.example-api pre {
  background: #FFFFFF;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #DCDFE6;
  margin: 10px 0;
  font-size: 12px;
  overflow-x: auto;
}

.example-api p {
  margin: 0;
  color: #606266;
  font-size: 12px;
}

.score-breakdown {
  background: #F8F9FA;
  padding: 15px;
  border-radius: 8px;
}

.score-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #FFFFFF;
  border-radius: 4px;
  border: 1px solid #DCDFE6;
}

.field-info {
  flex: 1;
}

.field-name {
  font-weight: bold;
  color: #303133;
}

.field-value {
  color: #606266;
  font-size: 12px;
  margin-left: 8px;
}

.field-score {
  flex: 2;
  margin-left: 20px;
}

.score-text {
  margin-right: 10px;
  font-weight: bold;
  color: #409EFF;
}

.total-score {
  display: flex;
  align-items: center;
  padding: 12px;
  background: linear-gradient(135deg, #409EFF 0%, #67C23A 100%);
  color: white;
  border-radius: 4px;
  margin-top: 10px;
}

.total-label {
  font-size: 16px;
  font-weight: bold;
}

.total-value {
  font-size: 20px;
  margin-left: auto;
}

.config-alert {
  margin-bottom: 15px;
}

.config-alert pre {
  margin: 10px 0 0 0;
  white-space: pre-wrap;
}

.evidence-section {
  margin-bottom: 20px;
}

.evidence-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.evidence-types,
.evidence-examples {
  background: #F8F9FA;
  padding: 15px;
  border-radius: 8px;
}

.evidence-table {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.evidence-item {
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #DCDFE6;
}

.quality-label {
  font-weight: bold;
  display: block;
  margin-bottom: 8px;
}

.weight-value {
  display: block;
  text-align: right;
  margin-top: 5px;
  color: #606266;
  font-size: 12px;
}

.evidence-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.evidence-card {
  padding: 12px;
  background: #FFFFFF;
  border-radius: 4px;
  border: 1px solid #DCDFE6;
}

.evidence-code {
  margin: 10px 0;
}

.evidence-code code {
  display: block;
  color: #606266;
  font-size: 12px;
  margin-bottom: 5px;
}

.evidence-code pre {
  margin: 0;
  padding: 8px;
  background: #F5F7FA;
  border-radius: 4px;
  font-size: 11px;
  overflow-x: auto;
}

.evidence-note {
  font-size: 12px;
  color: #909399;
  font-style: italic;
}

.demo-loading {
  text-align: center;
  padding: 20px;
}

.demo-results {
  margin-top: 10px;
}

.demo-results h4 {
  margin: 0 0 15px 0;
}
</style>