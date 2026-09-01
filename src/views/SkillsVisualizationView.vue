<template>
  <div class="skills-visualization">
    <!-- 背景装饰 -->
    <div class="decorative-bg"></div>
    <div class="decorative-bg-2"></div>

    <!-- 页面标题 -->
    <div class="page-title">
      <h1>Skills RAG 可视化平台</h1>
      <p>展示 AI 系统的智能搜索与代码生成流程</p>
    </div>

    <!-- 主要内容区域 -->
    <el-tabs v-model="activeTab" class="main-tabs">
      <!-- 实时搜索监控 -->
      <el-tab-pane label="🔍 实时搜索监控" name="monitor">
        <LiveSearchMonitor />
      </el-tab-pane>

      <!-- RAG 流程可视化 -->
      <el-tab-pane label="🔄 RAG 流程可视化" name="rag">
        <RagFlowVisualizer />
      </el-tab-pane>

      <!-- 搜索案例演示 -->
      <el-tab-pane label="📊 搜索案例演示" name="search">
        <SkillSearchDemo />
      </el-tab-pane>

      <!-- 数据统计分析 -->
      <el-tab-pane label="📈 数据统计分析" name="statistics">
        <SkillStatistics />
      </el-tab-pane>

      <!-- 技术实现细节 -->
      <el-tab-pane label="⚙️ 技术实现细节" name="implementation">
        <SkillImplementation />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import LiveSearchMonitor from '../components/LiveSearchMonitor.vue'
import RagFlowVisualizer from '../components/RagFlowVisualizer.vue'
import SkillSearchDemo from '../components/SkillSearchDemo.vue'
import SkillStatistics from '../components/ElegantStatistics.vue'
import SkillImplementation from '../components/SkillImplementation.vue'

const activeTab = ref('monitor')
</script>

<style scoped>
.skills-visualization {
  padding: var(--spacing-2xl);
  background: var(--background);
  min-height: 100vh;
}

:deep(.el-tabs__header) {
  margin-bottom: var(--spacing-3xl);
  border-bottom: 1px solid var(--border);
  padding-bottom: 0;
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.el-tabs__nav-wrap) {
  padding: 0 var(--spacing-md);
}

:deep(.el-tabs__item) {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  padding: 0 32px;
  height: 48px;
  line-height: 48px;
  color: var(--text-secondary);
  border: none;
  background: transparent;
  transition: var(--transition-base);
  margin-right: var(--spacing-md);
}

:deep(.el-tabs__item:hover) {
  color: var(--primary);
  background: rgba(59, 130, 246, 0.05);
}

:deep(.el-tabs__item.is-active) {
  color: var(--primary);
  font-weight: var(--font-weight-semibold);
}

:deep(.el-tabs__content) {
  background: var(--surface);
  border-radius: 8px;
  border: 1px solid var(--border);
  padding: var(--spacing-3xl);
  min-height: 500px;
  position: relative;
}

:deep(.el-tabs__content::before) {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--primary);
  border-radius: 8px 8px 0 0;
}

.page-title {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
}

.page-title h1 {
  font-size: 36px;
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

.page-title p {
  font-size: var(--font-size-lg);
  color: var(--text-secondary);
  margin-top: var(--spacing-md);
}

/* 清晰的视觉层次 - 移除装饰元素以减少视觉混乱 */
</style>