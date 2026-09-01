<template>
  <div class="app">
    <el-container>
      <!-- 头部导航 -->
      <el-header class="header">
        <div class="header-content">
          <div class="header-logo">
            <el-icon class="logo-icon"><DataLine /></el-icon>
            <span class="logo-text">Skills RAG Visualizer</span>
          </div>
          <div class="header-info">
            <p class="header-subtitle">ReqTrans Skills RAG 过程可视化平台</p>
            <div class="header-tags">
              <el-tag size="small" type="primary" effect="plain">AI</el-tag>
              <el-tag size="small" type="success" effect="plain">RAG</el-tag>
              <el-tag size="small" type="warning" effect="plain">Vue 3</el-tag>
              <el-tag size="small" type="info" effect="plain">ECharts</el-tag>
            </div>
          </div>
        </div>
      </el-header>

      <!-- 主内容区域 -->
      <el-main>
        <SkillsVisualizationView />
      </el-main>

      <!-- 页脚 -->
      <el-footer class="footer">
        <div class="footer-content">
          <p>基于 685 个真实 OpenHarmony Rust API 构建 | AI 可视化展示平台</p>
          <div class="footer-links">
            <a href="https://github.com" target="_blank" class="footer-link">
              <el-icon><Link /></el-icon>
              GitHub
            </a>
          </div>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import SkillsVisualizationView from './views/SkillsVisualizationView.vue'
import { DataLine, Link } from '@element-plus/icons-vue'
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: var(--bg-color);
}

.header {
  background: var(--primary);
  color: var(--surface);
  padding: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.header::after {
  display: none;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-2xl);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 32px;
  animation: pulse 2s infinite;
}

.logo-text {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.5px;
}

.header-subtitle {
  font-size: var(--font-size-sm);
  opacity: 0.9;
  margin: 0;
}

.header-tags {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.footer {
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding: var(--spacing-xl) var(--spacing-2xl);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-secondary);
}

.footer-links {
  display: flex;
  gap: var(--spacing-lg);
}

.footer-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--text-secondary);
  text-decoration: none;
  transition: var(--transition-base);
  font-size: var(--font-size-sm);
}

.footer-link:hover {
  color: var(--primary);
}

/* 动画效果 */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .footer-content {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .header-tags {
    justify-content: center;
  }
}
</style>