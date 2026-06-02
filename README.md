# chrome 插件工程

Chrome Extension 基础架构，基于 Vue 3 + Vite + TypeScript + Tailwind CSS。

## 使用 CLI 快速创建项目

### 方式一：npx（推荐）

```bash
npx create-ai-plugin my-plugin
```

### 方式二：全局安装后使用

```bash
npm install -g create-ai-plugin
create-ai-plugin my-plugin
```

### 交互提示

CLI 只会询问两个问题：

1. **Project name** — 项目名称（如果命令行已提供则跳过）
2. **Description** — 项目描述

其余选项使用默认值：

| 选项                   | 默认值           |
| ---------------------- | ---------------- |
| permissions            | `["storage"]`    |
| content script matches | `["<all_urls>"]` |
| insert script          | 包含             |
| popup view             | 包含             |
| package manager        | pnpm             |

### 创建后的项目结构

```
my-plugin/
├── public/
│   ├── manifest.json
│   └── images/
├── src/
│   ├── background/main.ts      ← Background service worker
│   ├── contentView/             ← Content script（注入页面的浮动窗口）
│   ├── insert/                  ← Insert script（页面上下文脚本）
│   ├── popupView/               ← Popup 弹出页面
│   ├── config/index.ts          ← 环境配置
│   ├── utils/                   ← 工具函数（消息通信、存储）
│   ├── styles/tailwind.css
│   └── main.ts
├── index.html
├── vite.config.ts               ← Popup 构建配置
├── vite.content.config.ts       ← Content script 构建配置
├── vite.background.config.ts    ← Background 构建配置
├── vite.insert.config.ts        ← Insert script 构建配置
├── postcss-add-important.ts     ← Content script CSS !important 插件
├── tsconfig.json
├── package.json
└── README.md
```

### 创建后下一步

```bash
cd my-plugin
pnpm dev        # 开发模式（popup 预览）
pnpm build      # 构建所有模块
```

构建完成后，在 Chrome 中加载 `dist/` 目录作为未打包的扩展即可。

---

## 本工程开发

### 安装依赖

```bash
pnpm install
```

### 运行

```bash
pnpm dev
```

### 打包

```bash
pnpm build
```

### CLI 开发

```bash
pnpm build:cli      # 构建 CLI
pnpm dev:cli        # 本地运行 CLI 测试
pnpm publish:cli    # 发布 CLI 到 npm
```

> 模板源码就是本工程的 `src/`、`public/` 等文件，修改它们即修改模板，无需维护独立的 templates 目录。
