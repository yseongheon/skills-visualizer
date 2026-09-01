import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.mount('#app')

// 全局样式优化
app.config.globalProperties.$ELEMENT = {
  size: 'default',
  zIndex: 3000
}

// 添加 Clean 设计系统全局 CSS 变量
const style = document.createElement('style')
style.textContent = `
  /* Clean 设计系统 - 颜色令牌 */
  :root {
    /* 核心颜色 */
    --primary: #3B82F6;
    --secondary: #8B5CF6;
    --success: #16A34A;
    --warning: #D97706;
    --danger: #DC2626;
    --surface: #FFFFFF;
    --text-primary: #111827;
    --text-secondary: #6B7280;
    --text-disabled: #9CA3AF;
    --border: #E5E7EB;
    --background: #F9FAFB;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: var(--text-primary);
  }

  .el-card {
    border: none;
    border-radius: 12px;
    transition: var(--transition-base);
    overflow: hidden;
  }

  /* Clean 设计系统 - 组件样式 */
  .el-card {
    border: 1px solid var(--border);
    border-radius: 8px;
    transition: var(--transition-base);
    overflow: hidden;
  }

  .el-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .el-button {
    border-radius: 8px;
    font-weight: 500;
    transition: var(--transition-base);
  }

  .el-button--primary {
    background: var(--primary);
    border: none;
    color: var(--surface);
  }

  .el-button--primary:hover {
    background: #2563EB;
    transform: translateY(-1px);
  }

  .el-input__inner {
    border-radius: 8px;
    border: 1px solid var(--border);
    transition: var(--transition-base);
  }

  .el-input__inner:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .el-table {
    border-radius: 12px;
    overflow: hidden;
  }

  .el-table th {
    background-color: var(--background);
    color: var(--text-primary);
    font-weight: 600;
  }

  .el-table td {
    border-bottom: 1px solid var(--border);
  }

  /* 自定义滚动条 */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: var(--bg-color);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: var(--text-secondary);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary);
  }

  /* Clean 动画效果 */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .fade-in {
    animation: fadeIn 0.3s ease-out;
  }

  /* 动画效果 */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .fade-in {
    animation: fadeIn 0.6s ease-out;
  }
`
document.head.appendChild(style)