import fs from 'fs-extra'
import path from 'path'
import pc from 'picocolors'
import { promptUser } from './prompts.js'
import { renderDir } from './render.js'
import { removeInsertScript, removePopup } from './remove.js'
import { installDependencies } from './utils.js'
import { createTemplateDir, cleanupTemplateDir } from './template.js'

export async function run(): Promise<void> {
  // Get project name from CLI args
  const argProjectDir = process.argv[2]

  // Prompt user for configuration
  const answers = await promptUser(argProjectDir)

  const targetDir = path.resolve(process.cwd(), answers.projectName)

  // Check if directory exists
  if (await fs.pathExists(targetDir)) {
    const existing = await fs.readdir(targetDir)
    if (existing.length > 0) {
      console.log(pc.red(`\n✖ Directory "${answers.projectName}" already exists and is not empty.`))
      process.exit(1)
    }
  }

  console.log(pc.dim(`\n📁 Creating project in ${targetDir}...`))

  // Ensure target directory
  await fs.ensureDir(targetDir)

  // 模板文件在构建时已复制到 dist/templates/ 下
  // 无论是本地开发还是 npm 安装后，模板都与 CLI 代码在同级
  const cliDistDir = path.dirname(new URL(import.meta.url).pathname)
  const projectRoot = path.resolve(cliDistDir, 'templates')

  let templateDir: string | undefined
  try {
    templateDir = await createTemplateDir(projectRoot, answers)

    // Copy and render templates
    await renderDir(templateDir, answers, targetDir)
  } finally {
    // 清理临时目录
    if (templateDir) {
      await cleanupTemplateDir(templateDir)
    }
  }

  // Conditionally remove modules
  if (!answers.withInsertScript) {
    await removeInsertScript(targetDir, answers)
  }

  if (!answers.withPopup) {
    await removePopup(targetDir, answers)
  }

  // Install dependencies
  await installDependencies(targetDir, answers.packageManager)

  // Success message
  console.log()
  console.log(pc.green('✔ Project created successfully!'))
  console.log()
  console.log(pc.dim('  Next steps:'))
  console.log(pc.cyan(`  cd ${answers.projectName}`))
  if (answers.withPopup) {
    console.log(pc.cyan(`  ${answers.packageManager} dev`))
  }
  console.log(pc.cyan(`  ${answers.packageManager} build`))
  console.log()
  console.log(pc.dim('  Then load the dist/ folder as an unpacked extension in Chrome.'))
  console.log()
}
