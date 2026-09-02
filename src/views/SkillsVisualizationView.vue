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

const activeTab = ref('rag') // 默认显示 RAG 流程可视化
</script>

<style scoped>
.skills-visualization {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  padding: 40px 0;
}

.decorative-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 20% 30%, rgba(64, 158, 255, 0.1) 0%, transparent 50%);
  z-index: -1;
}

.decorative-bg-2 {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 80% 70%, rgba(230, 162, 60, 0.1) 0%, transparent 50%);
  z-index: -1;
}

.page-title {
  text-align: center;
  margin-bottom: 48px;
  padding: 0 20px;
}

.page-title h1 {
  font-size: 42px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 16px;
  letter-spacing: -0.5px;
}

.page-title p {
  font-size: 20px;
  color: #606266;
  max-width: 900px;
  margin: 0 auto;
  line-height: 1.6;
}

.main-tabs {
  max-width: 1400px;
  margin: 0 auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
}

.main-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 0;
}

.main-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.main-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0 20px;
}

.main-tabs :deep(.el-tabs__item) {
  font-size: 18px;
  font-weight: 500;
  padding: 20px 32px;
  color: #606266;
  transition: all 0.3s ease;
  border-radius: 12px 12px 0 0;
}

.main-tabs :deep(.el-tabs__item:hover) {
  color: #409eff;
  background: #f8f9fa;
}

.main-tabs :deep(.el-tabs__item.is-active) {
  color: #409eff;
  font-weight: 600;
  background: #fff;
  border-bottom: 3px solid #409eff;
}

.main-tabs :deep(.el-tabs__active-bar) {
  height: 3px;
  background-color: #409eff;
}

.main-tabs :deep(.el-tabs__content) {
  padding: 32px;
  background: #fff;
}
</style>