# LoRA 元数据查看器/编辑器

纯 HTML/JS 工具，用于在本地浏览器中查看和编辑 LoRA 元数据，无需安装，也无需联网。

## 使用方法
无需任何预先设置，直接用任意现代浏览器打开 `index.html`，然后拖入 Safetensors 文件即可。也可以使用 GitHub 上托管的版本（见下方"演示"部分链接）。

## 演示
https://xypher7.github.io/lora-metadata-viewer

## 功能特性
- 可配置的元数据摘要
- CivitAI 资源在线查询（需要联网）
- 可配置的训练标签摘要
- 编辑或移除 Safetensors 文件中的元数据
- Doro :3

## 项目结构
项目被拆分为 `js/` 和 `css/` 目录下的小模块，由 `index.html` 统一加载：

| 文件 | 职责 |
|------|------|
| `css/main.css` | 设计系统、主题、响应式布局 |
| `js/config.js` | 全局常量与初始状态 |
| `js/utils.js` | 共享辅助函数（提示、JSON 着色、剪贴板） |
| `js/theme.js` | 主题切换（浅色/深色/自定义颜色） |
| `js/settings.js` | LocalStorage 设置持久化 |
| `js/hashing.js` | SHA-256 哈希计算（AutoV2/AutoV3） |
| `js/safetensors.js` | Safetensors 解析与文件重写 |
| `js/lookup.js` | CivitAI / Arc En Ciel 在线查询 |
| `js/tags.js` | 训练标签频率分析 |
| `js/summary.js` | 元数据摘要渲染 |
| `js/editor.js` | 元数据编辑器与下载 |
| `js/app.js` | 应用入口与逻辑装配 |

## 离线运行
所有文件处理都在浏览器本地完成，可完全离线使用，包括任意大小文件的哈希计算（SHA-256 采用纯 JavaScript 分块读取实现，无需外部库）。以下功能需要联网，离线时不可用：
- CivitAI / Arc En Ciel 数据查询
- 自动更新检查

## 截图
![应用截图](https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/5c3b0f97-d7ff-4c7a-b9c5-d5f176544151/original=true,quality=90/Screenshot%202025-10-01%20195536.jpeg)
