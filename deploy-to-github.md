# GitHub 部署指南

## 方法一：使用 Git 命令（如果网络正常）

```bash
# 确保在项目目录
cd /c/Users/38680/Desktop/前端展示项目/skills-visualizer

# 推送到 GitHub
git push -u origin master
```

## 方法二：使用 GitHub Desktop

1. 下载并安装 [GitHub Desktop](https://desktop.github.com/)
2. 登录您的 GitHub 账户
3. File → Add Local Repository
4. 选择项目目录
5. Publish repository
6. 填写仓库信息并发布

## 方法三：手动上传

1. 访问 https://github.com/yseongheon/skills-visualizer
2. 点击 "uploading an existing file"
3. 拖拽项目文件或使用 Git Archive

## 如果遇到认证问题

```bash
# 配置 Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 使用 Personal Access Token
git remote add origin https://github.com/yseongheon/skills-visualizer.git
git push -u origin master
```

## 网络问题解决

如果网络连接有问题，可能需要：
- 检查网络设置
- 使用 VPN
- 配置代理（如果需要）