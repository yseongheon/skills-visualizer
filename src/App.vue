<template>
  <div class="app">
    <el-container>
      <el-header class="header">
        <h1>Skills Visualizer</h1>
        <p>ReqTrans Skills RAG 过程可视化平台</p>
      </el-header>

      <el-main>
        <SkillsVisualizationView />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import SkillsVisualizationView from './views/SkillsVisualizationView.vue'
</script>

<style scoped>
.app {
  min-height: 100vh;
}

.header {
  background-color: #409EFF;
  color: white;
  text-align: center;
  padding: 20px;
}

.header h1 {
  margin: 0;
  font-size: 32px;
}

.header p {
  margin: 10px 0 0;
  font-size: 16px;
  opacity: 0.9;
}
</style>