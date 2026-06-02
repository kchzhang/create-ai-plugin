import fs from 'fs-extra'
import path from 'path'
import { type UserAnswers } from './prompts.js'

/**
 * Remove insert-script related files and config entries,
 * and clean up manifest.json.
 */
export async function removeInsertScript(targetDir: string, answers: UserAnswers): Promise<void> {
  // Remove insert source directory
  const insertDir = path.join(targetDir, 'src/insert')
  if (await fs.pathExists(insertDir)) {
    await fs.remove(insertDir)
  }

  // Remove vite.insert.config.ts
  const insertConfig = path.join(targetDir, 'vite.insert.config.ts')
  if (await fs.pathExists(insertConfig)) {
    await fs.remove(insertConfig)
  }

  // Update build script in package.json
  const pkgPath = path.join(targetDir, 'package.json')
  if (await fs.pathExists(pkgPath)) {
    const pkg = await fs.readJson(pkgPath)
    if (pkg.scripts?.build) {
      pkg.scripts.build = pkg.scripts.build.replace(
        / && vite build -c vite\.insert\.config\.ts/g,
        ''
      )
      await fs.writeJson(pkgPath, pkg, { spaces: 2 })
    }
  }

  // Remove insert script injection from content script
  const contentMainPath = path.join(targetDir, 'src/contentView/main.ts')
  if (await fs.pathExists(contentMainPath)) {
    let content = await fs.readFile(contentMainPath, 'utf-8')
    content = content.replace(
      /\/\/ 向目标页面注入 insert script[\s\S]*?\} catch \(err\) \{\}\n/,
      ''
    )
    await fs.writeFile(contentMainPath, content)
  }

  // Update manifest.json: remove web_accessible_resources
  const manifestPath = path.join(targetDir, 'public/manifest.json')
  if (await fs.pathExists(manifestPath)) {
    const manifest = await fs.readJson(manifestPath)
    delete manifest.web_accessible_resources
    await fs.writeJson(manifestPath, manifest, { spaces: 2 })
  }
}

/**
 * Remove popup related files and config entries,
 * and clean up manifest.json.
 */
export async function removePopup(targetDir: string, answers: UserAnswers): Promise<void> {
  // Remove popup source directory
  const popupDir = path.join(targetDir, 'src/popupView')
  if (await fs.pathExists(popupDir)) {
    await fs.remove(popupDir)
  }

  // Remove index.html (popup entry)
  const indexHtml = path.join(targetDir, 'index.html')
  if (await fs.pathExists(indexHtml)) {
    await fs.remove(indexHtml)
  }

  // Remove vite.config.ts (popup's vite config)
  const viteConfigPath = path.join(targetDir, 'vite.config.ts')
  if (await fs.pathExists(viteConfigPath)) {
    await fs.remove(viteConfigPath)
  }

  // Update build script in package.json
  const pkgPath = path.join(targetDir, 'package.json')
  if (await fs.pathExists(pkgPath)) {
    const pkg = await fs.readJson(pkgPath)
    if (pkg.scripts?.build) {
      pkg.scripts.build = pkg.scripts.build.replace(
        /vue-tsc -b && vite build -c vite\.config\.ts &&/g,
        'vue-tsc -b &&'
      )
      // Clean up trailing &&
      pkg.scripts.build = pkg.scripts.build.replace(/\s*&&\s*$/, '')
      // If build is just "vue-tsc -b" without any vite build, add content build
      if (!pkg.scripts.build.includes('vite build')) {
        pkg.scripts.build = 'vue-tsc -b && vite build -c vite.content.config.ts && vite build -c vite.background.config.ts'
      }
      await fs.writeJson(pkgPath, pkg, { spaces: 2 })
    }
    // Remove dev script since no popup to serve
    if (pkg.scripts?.dev) {
      delete pkg.scripts.dev
    }
    await fs.writeJson(pkgPath, pkg, { spaces: 2 })
  }

  // Update manifest.json: remove action
  const manifestPath = path.join(targetDir, 'public/manifest.json')
  if (await fs.pathExists(manifestPath)) {
    const manifest = await fs.readJson(manifestPath)
    delete manifest.action
    await fs.writeJson(manifestPath, manifest, { spaces: 2 })
  }

  // Update main.ts - remove popup import and mount
  const mainTsPath = path.join(targetDir, 'src/main.ts')
  if (await fs.pathExists(mainTsPath)) {
    let content = await fs.readFile(mainTsPath, 'utf-8')
    content = content.replace(/import App from '\.\/popupView\/App\.vue'\n/g, '')
    content = content.replace(/createApp\(App\)\.mount\('#app'\)\n/g, '')
    content = content.replace(/import { createApp } from 'vue'\n/g, '')
    await fs.writeFile(mainTsPath, content)
  }
}
