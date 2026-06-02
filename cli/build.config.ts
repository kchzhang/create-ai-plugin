import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/index'],
  clean: true,
  declaration: false,
  rollup: {
    emitCJS: false,
    inlineDependencies: true,
  },
  externals: ['prompts', 'picocolors', 'fs-extra', 'execa'],
  hooks: {
    'build:done': async () => {
      const fs = await import('fs-extra')
      const path = await import('path')

      const projectRoot = path.resolve(__dirname, '..')
      const templateDir = path.resolve(__dirname, 'dist/templates')

      // 清空旧模板
      await fs.remove(templateDir)
      await fs.ensureDir(templateDir)

      // 复制根目录文件
      const rootFiles = [
        'index.html',
        'vite.config.ts',
        'vite.content.config.ts',
        'vite.background.config.ts',
        'vite.insert.config.ts',
        'tsconfig.json',
        'tsconfig.app.json',
        'tsconfig.node.json',
        'postcss-add-important.ts',
      ]
      for (const file of rootFiles) {
        const src = path.join(projectRoot, file)
        if (await fs.pathExists(src)) {
          await fs.copy(src, path.join(templateDir, file))
        }
      }

      // 复制目录（排除 node_modules 等）
      const dirs = ['src', 'public']
      const excludePatterns = ['node_modules', 'dist', '.git', 'cli', 'pnpm-lock.yaml', 'package.json']
      for (const dir of dirs) {
        const srcDir = path.join(projectRoot, dir)
        if (await fs.pathExists(srcDir)) {
          await fs.copy(srcDir, path.join(templateDir, dir), {
            filter: (src: string) => {
              const rel = path.relative(projectRoot, src)
              return !excludePatterns.some(p => rel === p || rel.startsWith(p + '/'))
            },
          })
        }
      }

      console.log('✔ Templates copied to dist/templates/')
    },
  },
})
