<template>
  <div class="knowledge-entry">
    <el-card class="entry-card">
      <template #header>
        <div class="entry-header">
          <h3>{{ entry.api_name }}</h3>
          <div class="entry-tags">
            <el-tag :type="getApiTypeTag(entry.api_source_type)">
              {{ entry.api_source_type }}
            </el-tag>
            <el-tag type="success">评分: {{ entry.score?.toFixed(3) || 'N/A' }}</el-tag>
          </div>
        </div>
      </template>

      <!-- 功能摘要 -->
      <div class="section">
        <h4>功能摘要</h4>
        <p>{{ entry.function_summary }}</p>
      </div>

      <!-- 来源信息 -->
      <div class="section">
        <h4>来源信息</h4>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="名称">
            {{ entry.source?.name || 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="类型">
            {{ entry.source?.source_kind || 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="本地路径">
            {{ entry.source?.local_path || 'N/A' }}
          </el-descriptions-item>
          <el-descriptions-item label="GN 目标">
            {{ entry.source?.gn_target || 'N/A' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 构建兼容性 -->
      <div class="section">
        <h4>构建兼容性</h4>
        <el-tabs>
          <el-tab-pane label="Cargo">
            <div class="build-info">
              <el-alert
                v-if="entry.build_support?.cargo_supported"
                title="Cargo 支持"
                type="success"
                :closable="false"
              >
                <div class="build-details">
                  <p>支持状态: <el-tag type="success">是</el-tag></p>
                  <p v-if="entry.build_support?.cargo_dependency">
                    依赖: {{ entry.build_support.cargo_dependency }}
                  </p>
                  <p v-if="entry.build_support?.rust_version_requirement">
                    Rust 版本: {{ entry.build_support.rust_version_requirement }}
                  </p>
                </div>
              </el-alert>
              <el-alert
                v-else
                title="Cargo 不支持"
                type="warning"
                :closable="false"
              >
                暂不支持 Cargo 构建系统
              </el-alert>
            </div>
          </el-tab-pane>
          <el-tab-pane label="OpenHarmony GN">
            <div class="build-info">
              <el-alert
                v-if="entry.build_support?.openharmony_gn_supported"
                title="GN 支持"
                type="success"
                :closable="false"
              >
                <div class="build-details">
                  <p>支持状态: <el-tag type="success">是</el-tag></p>
                  <p v-if="entry.build_support?.openharmony_gn_targets">
                    构建目标: {{ entry.build_support.openharmony_gn_targets.join(', ') }}
                  </p>
                  <p v-if="entry.build_support?.bundle_components">
                    组件: {{ entry.build_support.bundle_components.join(', ') }}
                  </p>
                </div>
              </el-alert>
              <el-alert
                v-else
                title="GN 不支持"
                type="warning"
                :closable="false"
              >
                暂不支持 OpenHarmony GN 构建系统
              </el-alert>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 使用证据 -->
      <div class="section" v-if="entry.usage && entry.usage.length > 0">
        <h4>使用证据</h4>
        <div class="usage-list">
          <div
            v-for="(usage, index) in entry.usage"
            :key="index"
            class="usage-item"
          >
            <div class="usage-header">
              <el-tag :type="getQualityTag(usage.quality)" size="small">
                {{ usage.quality }}
              </el-tag>
              <span class="usage-location">
                {{ usage.file }}:{{ usage.line }}
              </span>
            </div>
            <code class="usage-code">{{ usage.code }}</code>
          </div>
        </div>
      </div>

      <!-- 相关操作 -->
      <div class="actions">
        <el-button type="primary" @click="viewSource">
          查看源码
        </el-button>
        <el-button @click="copyApiName">
          复制 API 名称
        </el-button>
        <el-button @click="shareEntry">
          分享
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'

const props = defineProps({
  entry: {
    type: Object,
    required: true
  }
})

// 获取 API 类型标签
const getApiTypeTag = (type) => {
  const tagMap = {
    'third_party_rust_crate': 'info',
    'openharmony_builtin': 'success',
    'ffi_wrapper': 'warning',
    'module_rust_api': 'primary'
  }
  return tagMap[type] || 'info'
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

// 查看源码
const viewSource = () => {
  // 这里可以打开源码查看
  ElMessage.info('查看源码功能开发中')
}

// 复制 API 名称
const copyApiName = () => {
  navigator.clipboard.writeText(props.entry.api_name)
  ElMessage.success('API 名称已复制到剪贴板')
}

// 分享条目
const shareEntry = () => {
  // 这里实现分享功能
  ElMessage.info('分享功能开发中')
}
</script>

<style scoped>
.knowledge-entry {
  max-width: 800px;
  margin: 0 auto;
}

.entry-card {
  border-radius: 8px;
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
}

.entry-header h3 {
  margin: 0;
  color: #303133;
}

.entry-tags {
  display: flex;
  gap: 8px;
}

.section {
  margin-bottom: 20px;
}

.section h4 {
  margin: 0 0 10px 0;
  color: #606266;
  font-size: 16px;
}

.section p {
  margin: 0;
  line-height: 1.6;
  color: #303133;
}

.build-details {
  margin-top: 10px;
}

.build-details p {
  margin: 5px 0;
}

.usage-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.usage-item {
  background: #F5F7FA;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #DCDFE6;
}

.usage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.usage-location {
  color: #909399;
  font-size: 12px;
}

.usage-code {
  display: block;
  background: #FFFFFF;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #DCDFE6;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  overflow-x: auto;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}
</style>