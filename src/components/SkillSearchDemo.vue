<template>
  <div class="search-demo">
    <!-- 搜索输入区域 -->
    <el-card class="search-input">
      <template #header>
        <div class="card-header">
          <h3>🔍 搜索输入</h3>
          <el-tag type="info">RAG 的 Retrieval 环节</el-tag>
        </div>
      </template>

      <!-- 原始 API 输入 -->
      <div class="input-group">
        <label>原始 C++ API：</label>
        <el-input
          v-model="searchInput.originalApi"
          placeholder="例如：IPCMessageParcel::WriteInterfaceToken"
          class="api-input"
        />
      </div>

      <!-- 自动提取的关键词 -->
      <div class="keyword-extraction">
        <label>提取的关键词：</label>
        <div class="keyword-tags">
          <el-tag
            v-for="tag in extractedKeywords"
            :key="tag"
            type="primary"
            closable
            @close="removeKeyword(tag)"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-if="showKeywordInput"
            v-model="newKeyword"
            placeholder="添加关键词"
            @keyup.enter="addKeyword"
            @blur="showKeywordInput = false"
            class="keyword-input"
          />
          <el-button
            v-else
            type="primary"
            plain
            @click="showKeywordInput = true"
            size="small"
          >
            + 添加
          </el-button>
        </div>
      </div>

      <!-- 构建系统选择 -->
      <div class="build-system">
        <label>构建系统：</label>
        <el-radio-group v-model="searchInput.buildSystem">
          <el-radio label="cargo">Cargo</el-radio>
          <el-radio label="openharmony_gn">OpenHarmony GN</el-radio>
          <el-radio label="any">任意</el-radio>
        </el-radio-group>
      </div>

      <!-- 搜索按钮 -->
      <div class="search-actions">
        <el-button
          type="primary"
          @click="performSearch"
          :loading="searching"
        >
          {{ searching ? '搜索中...' : '开始搜索' }}
        </el-button>
        <el-button @click="saveCurrentCase">
          <el-icon><Collection /></el-icon>&nbsp;保存为案例
        </el-button>
      </div>
    </el-card>

    <!-- 搜索案例库 -->
    <el-card class="case-library">
      <template #header>
        <div class="card-header">
          <h3>📚 搜索案例库</h3>
          <el-tag type="info">{{ allCases.length }} 个案例</el-tag>
        </div>
      </template>

      <div v-if="allCases.length === 0" class="empty-cases">
        <el-empty description="暂无案例" />
      </div>

      <div v-else class="case-list">
        <div
          v-for="c in allCases"
          :key="c.key"
          class="case-card"
          :class="{ preset: c.preset }"
          @dblclick="loadCase(c)"
        >
          <div class="case-info">
            <div class="case-name-row">
              <span class="case-name">{{ c.name }}</span>
              <el-tag v-if="c.preset" type="info" size="small">预设</el-tag>
              <el-tag v-else type="success" size="small">自定义</el-tag>
              <el-tag :type="c.buildSystem === 'openharmony_gn' ? 'success' : 'primary'" size="small">
                {{ c.buildSystem === 'openharmony_gn' ? 'OpenHarmony GN' : 'Cargo' }}
              </el-tag>
            </div>
            <div class="case-original">{{ c.originalApi }}</div>
            <div v-if="c.keywords && c.keywords.length" class="case-keywords">
              <el-tag
                v-for="k in c.keywords"
                :key="k"
                type="primary"
                effect="plain"
                size="small"
                class="kw-tag"
              >
                {{ k }}
              </el-tag>
            </div>
          </div>
          <div class="case-actions">
            <el-button size="small" type="primary" @click="loadCase(c)">加载</el-button>
            <el-button v-if="!c.preset" size="small" type="danger" plain @click="deleteCase(c.key)">
              删除
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 搜索结果展示 -->
    <el-card class="search-results">
      <template #header>
        <div class="card-header">
          <h3>搜索结果</h3>
          <span v-if="searchResults.length > 0">
            找到 {{ searchResults.length }} 个候选 API
          </span>
        </div>
      </template>

      <div v-if="searching" class="searching">
        <el-skeleton :rows="3" animated />
      </div>

      <div v-else-if="searchResults.length === 0" class="no-results">
        <el-empty description="暂无搜索结果" />
      </div>

      <div v-else class="results-list">
        <div
          v-for="(api, index) in searchResults"
          :key="index"
          class="api-item"
          :class="{ 'selected': selectedIndex === index }"
          @click="selectApi(index)"
        >
          <div class="api-header">
            <h4>{{ api.api_name }}</h4>
            <div class="score-tags">
              <el-tag type="success">评分: {{ api.score.toFixed(3) }}</el-tag>
              <el-tag
                v-if="api.api_source_type"
                size="small"
                type="info"
              >
                {{ api.api_source_type }}
              </el-tag>
            </div>
          </div>

          <p class="api-summary">{{ api.function_summary }}</p>

          <div class="match-details">
            <el-collapse>
              <el-collapse-item title="评分详情">
                <div class="score-details">
                  <div
                    v-for="(score, field) in api.score_details"
                    :key="field"
                    class="score-item"
                  >
                    <span class="field-name">{{ getFieldLabel(field) }}:</span>
                    <el-progress
                      :percentage="calculatePercentage(score, api.score)"
                      :format="scoreFormat"
                    />
                    <span class="score-value">{{ score.toFixed(3) }}</span>
                  </div>
                </div>
              </el-collapse-item>

              <el-collapse-item title="构建兼容性">
                <div class="build-info">
                  <el-alert
                    v-if="api.build_support?.cargo?.supported"
                    title="Cargo 支持"
                    type="success"
                    :closable="false"
                  >
                    依赖：{{ api.build_support.cargo.dependencies_toml || '无' }}
                  </el-alert>
                  <el-alert
                    v-else
                    title="Cargo 不支持"
                    type="warning"
                    :closable="false"
                  />

                  <el-alert
                    v-if="api.build_support?.openharmony_gn?.supported"
                    title="OpenHarmony GN 支持"
                    type="success"
                    :closable="false"
                  >
                    目标：{{ api.build_support.openharmony_gn.build_targets?.join(', ') || '无' }}
                  </el-alert>
                  <el-alert
                    v-else
                    title="OpenHarmony GN 不支持"
                    type="warning"
                    :closable="false"
                  />
                </div>
              </el-collapse-item>

              <el-collapse-item title="使用证据">
                <div class="usage-evidence">
                  <div
                    v-for="(usage, uIndex) in api.usage.slice(0, 3)"
                    :key="uIndex"
                    class="evidence-item"
                  >
                    <el-tag
                      :type="getQualityTag(usage.quality)"
                      size="small"
                    >
                      {{ usage.quality }}
                    </el-tag>
                    <span class="evidence-location">
                      {{ usage.file }}:{{ usage.line }}
                    </span>
                    <code class="evidence-code">{{ usage.code }}</code>
                  </div>
                  <div v-if="api.usage.length > 3" class="more-evidence">
                    还有 {{ api.usage.length - 3 }} 条证据...
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { KnowledgeBaseLoader } from '../utils/kb-loader'
import { Scorer } from '../utils/scoring'
import presetExamples from '../data/search-examples.json'

const searchInput = ref({
  originalApi: 'IPCMessageParcel::WriteInterfaceToken',
  query: 'IPC message parcel write interface',
  buildSystem: 'cargo'
})

const extractedKeywords = ref(['IPC', 'message', 'parcel', 'interface'])
const showKeywordInput = ref(false)
const newKeyword = ref('')
const searching = ref(false)
const searchResults = ref([])
const selectedIndex = ref(-1)
const kbLoader = new KnowledgeBaseLoader()

// 自定义案例：localStorage 持久化
const STORAGE_KEY = 'skills-visualizer:saved-cases'
const savedCases = ref(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))

// 预设案例（带 key 以便渲染）
const presetCases = computed(() =>
  presetExamples.map(ex => ({
    key: `preset-${ex.id}`,
    id: ex.id,
    name: ex.name,
    originalApi: ex.originalApi,
    keywords: (ex.query || '').split(' '),
    buildSystem: ex.buildSystem || 'cargo',
    preset: true
  }))
)

// 合并显示：自定义在前、预设在后（均可加载）
const allCases = computed(() => [
  ...savedCases.value.map(s => ({ ...s, preset: false, key: `saved-${s.id}` })),
  ...presetCases.value
])

const persistSavedCases = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCases.value))
}

// 保存当前查询为自定义案例
const saveCurrentCase = () => {
  if (!searchInput.value.originalApi.trim()) {
    ElMessage.warning('请先输入原始 API 再保存')
    return
  }
  const id = Date.now()
  savedCases.value.push({
    id,
    name: searchInput.value.originalApi.trim().slice(0, 40),
    originalApi: searchInput.value.originalApi,
    keywords: [...extractedKeywords.value],
    buildSystem: searchInput.value.buildSystem
  })
  persistSavedCases()
  ElMessage.success('已保存为自定义案例')
}

// 删除自定义案例
const deleteCase = (key) => {
  const id = Number(String(key).replace('saved-', ''))
  savedCases.value = savedCases.value.filter(s => s.id !== id)
  persistSavedCases()
  ElMessage.success('已删除该案例')
}

// 加载案例到搜索框
const loadCase = (c) => {
  searchInput.value = {
    originalApi: c.originalApi || '',
    query: (c.keywords || []).join(' '),
    buildSystem: c.buildSystem || 'cargo'
  }
  extractedKeywords.value = [...(c.keywords || [])]
  ElMessage.success(`已加载案例：${c.name}`)
}

// 从原始 API 提取关键词
const extractKeywords = (api) => {
  const keywords = []
  const patterns = [
    /[A-Z][a-z]+/g,  // 驼峰命名
    /([A-Z][a-z]*)+/g, // 更细粒度的分割
  ]

  patterns.forEach(pattern => {
    const matches = api.match(pattern) || []
    keywords.push(...matches.filter(k => k.length > 2))
  })

  return [...new Set(keywords.map(k => k.toLowerCase()))]
}

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
    usage: '使用证据',
    usage_quality: '质量评分',
    source_kind: '来源类型'
  }
  return labels[field] || field
}

// 获取质量标签类型
const getQualityTag = (quality) => {
  const tagMap = {
    production: 'success',
    test: 'primary',
    example: 'warning',
    documentation: 'info',
    synthetic: 'info'
  }
  return tagMap[quality] || 'info'
}

// 移除关键词
const removeKeyword = (keyword) => {
  extractedKeywords.value = extractedKeywords.value.filter(k => k !== keyword)
}

// 添加关键词
const addKeyword = () => {
  if (newKeyword.value && !extractedKeywords.value.includes(newKeyword.value.toLowerCase())) {
    extractedKeywords.value.push(newKeyword.value.toLowerCase())
    newKeyword.value = ''
    showKeywordInput.value = false
  }
}

// 选择 API
const selectApi = (index) => {
  selectedIndex.value = index
}

// 执行搜索
const performSearch = async () => {
  if (!searchInput.value.originalApi) {
    ElMessage.warning('请输入原始 API')
    return
  }

  searching.value = true

  try {
    // 从原始 API 提取查询词
    const queryTokens = extractKeywords(searchInput.value.originalApi)
    const query = queryTokens.join(' ')

    // 执行真实搜索
    const results = await kbLoader.search(query, searchInput.value.buildSystem, 10)
    searchResults.value = results

    if (results.length === 0) {
      ElMessage.info('没有找到匹配的 API')
    }
  } catch (error) {
    ElMessage.error('搜索失败：' + error.message)
  } finally {
    searching.value = false
  }
}

// 加载示例（预设案例库中的 JSON 操作）
const loadExample = () => {
  const ex = presetExamples.find(e => e.name === 'JSON 操作') || presetExamples[0]
  loadCase({
    name: ex.name,
    originalApi: ex.originalApi,
    keywords: (ex.query || '').split(' '),
    buildSystem: ex.buildSystem || 'cargo'
  })
}

// 监听原始 API 输入
watch(searchInput.value.originalApi, (newValue) => {
  if (newValue) {
    const keywords = extractKeywords(newValue)
    extractedKeywords.value = keywords
  }
})
</script>

<style scoped>
.search-demo {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-input,
.search-results {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
}

.input-group {
  margin-bottom: 15px;
}

.input-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.keyword-extraction,
.build-system {
  margin-bottom: 15px;
}

.keyword-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.keyword-input {
  width: 120px;
}

.search-actions {
  display: flex;
  gap: 10px;
}

.api-item {
  border: 1px solid #DCDFE6;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.api-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-color: #409EFF;
}

.api-item.selected {
  border-color: #409EFF;
  background-color: #F0F9FF;
}

.api-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 10px;
}

.api-header h4 {
  margin: 0;
  color: #303133;
}

.score-tags {
  display: flex;
  gap: 8px;
}

.api-summary {
  color: #606266;
  margin-bottom: 15px;
  line-height: 1.5;
}

.score-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.score-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-name {
  font-weight: bold;
  color: #606266;
}

.score-value {
  align-self: flex-end;
  color: #909399;
  font-size: 12px;
}

.build-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.usage-evidence {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.evidence-item {
  padding: 8px;
  background: #F5F7FA;
  border-radius: 4px;
}

.evidence-location {
  color: #909399;
  font-size: 12px;
  margin: 4px 0;
}

.evidence-code {
  display: block;
  background: #FFFFFF;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  border: 1px solid #DCDFE6;
}

.more-evidence {
  color: #909399;
  font-size: 12px;
  text-align: center;
  padding: 8px;
}

.searching,
.no-results {
  padding: 40px 0;
}

.case-library {
  margin-bottom: 20px;
}

.empty-cases {
  padding: 16px;
}

.case-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.case-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
  transition: all 0.25s ease;
}

.case-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.12);
}

.case-card.preset {
  background: #fafafa;
}

.case-info {
  flex: 1;
  min-width: 0;
}

.case-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.case-name {
  font-weight: 600;
  color: #303133;
}

.case-original {
  font-size: 13px;
  color: #909399;
  font-family: 'Courier New', monospace;
  word-break: break-all;
}

.case-keywords {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.kw-tag {
  margin: 0;
}

.case-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .case-card {
    flex-direction: column;
    align-items: stretch;
  }

  .case-actions {
    justify-content: flex-end;
  }

  .search-actions {
    flex-wrap: wrap;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>