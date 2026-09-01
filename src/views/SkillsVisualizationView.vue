<template>
  <div class="skills-visualization">
    <el-tabs v-model="activeTab">
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
import SkillStatistics from '../components/SkillStatistics.vue'
import SkillImplementation from '../components/SkillImplementation.vue'

const activeTab = ref('monitor')
</script>

<style scoped>
.skills-visualization {
  padding: 20px;
}

:deep(.el-tabs__header) {
  margin-bottom: 20px;
}

:deep(.el-tabs__content) {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>