import fs from 'fs-extra'
import path from 'path'
import { type UserAnswers } from './prompts.js'

/**
 * 从工程根目录收集模板文件，生成带有 {{variable}} 占位符的临时模板目录。
 * 这样模板和工程源码合一，改一处即可。
 *
 * 策略：
 * - 读取工程 src/、public/、index.html、vite.*.config.ts、tsconfig*.json、postcss-add-important.ts
 * - 对 package.json 和 manifest.json 模板化处理（替换 name 等为占位符）
 * - 其他文件原样复制
 * - 返回临时模板目录路径，调用方负责清理
 */

/** 需要排除的文件/目录（相对于工程根目录） */
const EXCLUDE_PATTERNS = [
  'node_modules',
  'dist',
  '.git',
  'cli',           // 排除 cli 自身
  'pnpm-lock.yaml',
  'package.json',  // package.json 单独生成模板版本
]

/** 需要从工程根目录复制的一级文件 */
const ROOT_FILES = [
  'index.html',
  'vite.config.ts',
  'vite.content.config.ts',
  'vite.background.config.ts',
  'vite.insert.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'postcss-add-important.ts',
  '.gitignore',
]

/** 需要从工程根目录复制的目录 */
const ROOT_DIRS = [
  'src',
  'public',
  '.vscode',
]

/**
 * 生成模板化的 package.json 内容
 */
function generatePackageJson(answers: UserAnswers): string {
  const buildParts = [
    'vue-tsc -b',
  ]
  if (answers.withPopup) {
    buildParts.push('vite build -c vite.config.ts')
  }
  buildParts.push('vite build -c vite.content.config.ts')
  buildParts.push('vite build -c vite.background.config.ts')
  if (answers.withInsertScript) {
    buildParts.push('vite build -c vite.insert.config.ts')
  }

  const pkg = {
    name: '{{projectName}}',
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: {
      ...(answers.withPopup ? { dev: 'vite --force' } : {}),
      build: buildParts.join(' && '),
      preview: 'vite preview',
    },
    dependencies: {
      vue: '^3.5.18',
    },
    devDependencies: {
      '@tailwindcss/vite': '^4.3.0',
      '@types/node': '^24.5.2',
      '@vitejs/plugin-vue': '^6.0.1',
      '@vue/tsconfig': '^0.7.0',
      'postcss': '^8.5.15',
      'tailwindcss': '^4.3.0',
      'typescript': '~6.0.3',
      'vite': '^7.1.2',
      'vue-tsc': '^3.0.5',
    },
  }
  return JSON.stringify(pkg, null, 2)
}

/**
 * 生成模板化的 manifest.json 内容
 */
function generateManifestJson(answers: UserAnswers): string {
  const manifest: Record<string, any> = {
    name: '{{projectName}}',
    version: '1.0',
    description: '{{description}}',
    manifest_version: 3,
    background: {
      service_worker: 'background.js',
    },
    content_scripts: [
      {
        matches: '{{contentScriptMatches}}',
        css: ['content.css'],
        js: ['content.js'],
        run_at: 'document_end',
      },
    ],
    permissions: '{{permissions}}',
  }

  if (answers.withInsertScript) {
    manifest.web_accessible_resources = [
      {
        resources: ['insert.js'],
        matches: ['<all_urls>'],
      },
    ]
  }

  if (answers.withPopup) {
    manifest.action = {
      default_popup: 'index.html',
      default_title: '{{projectName}}',
    }
  }

  return JSON.stringify(manifest, null, 2)
}

/**
 * 从工程根目录创建临时模板目录。
 * 返回临时目录路径。
 */
export async function createTemplateDir(
  projectRoot: string,
  answers: UserAnswers
): Promise<string> {
  const tmpDir = path.join(
    process.platform === 'win32' ? process.env.TEMP || '.' : '/tmp',
    `@knoxzhang-create-ai-plugin-template-${Date.now()}`
  )
  await fs.ensureDir(tmpDir)

  // 1. 生成 package.json（模板化）
  await fs.writeFile(
    path.join(tmpDir, 'package.json'),
    generatePackageJson(answers)
  )

  // 2. 复制根目录文件
  for (const file of ROOT_FILES) {
    const srcPath = path.join(projectRoot, file)
    if (await fs.pathExists(srcPath)) {
      await fs.copy(srcPath, path.join(tmpDir, file))
    }
  }

  // 3. 复制目录（排除特定文件）
  for (const dir of ROOT_DIRS) {
    const srcDir = path.join(projectRoot, dir)
    if (await fs.pathExists(srcDir)) {
      await fs.copy(srcDir, path.join(tmpDir, dir), {
        filter: (src) => {
          const rel = path.relative(projectRoot, src)
          return !EXCLUDE_PATTERNS.some(p => rel === p || rel.startsWith(p + '/'))
        },
      })
    }
  }

  // 4. 用模板化的 manifest.json 覆盖复制过来的原版
  await fs.writeFile(
    path.join(tmpDir, 'public', 'manifest.json'),
    generateManifestJson(answers)
  )

  return tmpDir
}

/**
 * 清理临时模板目录
 */
export async function cleanupTemplateDir(tmpDir: string): Promise<void> {
  await fs.remove(tmpDir)
}
