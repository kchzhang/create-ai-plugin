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
      const { glob } = await import('glob')

      const projectRoot = path.resolve(__dirname, '..')
      const templateDir = path.resolve(__dirname, 'dist/templates')

      // 排除的文件和目录
      const excludeFiles = ['package.json', 'pnpm-lock.yaml', 'package-lock.json', 'README.md', '.DS_Store']
      const excludeDirs = ['node_modules', 'cli', 'dist', '.git']

      // 清空旧模板
      await fs.remove(templateDir)
      await fs.ensureDir(templateDir)

      // 自动收集根目录下的文件（包含点文件）
      const rootFiles = await glob('*', {
        cwd: projectRoot,
        nodir: true,
        dot: true,
        ignore: excludeFiles,
      })
      for (const file of rootFiles) {
        await fs.copy(path.join(projectRoot, file), path.join(templateDir, file))
      }

      // 自动收集根目录下的子目录（包含点目录）
      const dirs = (await glob('*/', {
        cwd: projectRoot,
        dot: true,
        ignore: excludeDirs,
      })).map(d => d.replace(/\/$/, ''))

      for (const dir of dirs) {
        await fs.copy(path.join(projectRoot, dir), path.join(templateDir, dir), {
          filter: (src: string) => {
            const rel = path.relative(projectRoot, src)
            return !excludeDirs.some(p => rel === p || rel.startsWith(p + '/'))
          },
        })
      }

      console.log('✔ Templates copied to dist/templates/')
    },
  },
})
