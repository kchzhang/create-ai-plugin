import fs from 'fs-extra'
import path from 'path'
import { type UserAnswers } from './prompts.js'

/**
 * Render template variables in file content.
 * Supports {{variableName}} syntax for strings.
 * For JSON files, handles array/object replacements properly.
 */
function renderTemplate(content: string, vars: Record<string, any>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (key in vars) {
      const value = vars[key]
      if (Array.isArray(value)) {
        return value.join(', ')
      }
      return String(value)
    }
    return _
  })
}

/**
 * Render JSON content with template variables, properly handling arrays.
 * Pattern: "{{variableName}}" (with surrounding quotes) gets replaced with the actual JSON value.
 */
function renderJson(content: string, vars: Record<string, any>): string {
  let result = content

  // First pass: replace "{{key}}" (quoted placeholder) with actual JSON value
  for (const [key, value] of Object.entries(vars)) {
    const placeholder = `"{{${key}}}"`
    if (result.includes(placeholder)) {
      result = result.replaceAll(placeholder, JSON.stringify(value))
    }
  }

  // Second pass: handle any remaining {{key}} without quotes
  result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (key in vars) {
      const value = vars[key]
      if (Array.isArray(value)) {
        return JSON.stringify(value)
      }
      return String(value)
    }
    return _
  })

  return result
}

export async function renderDir(
  dirPath: string,
  answers: UserAnswers,
  targetDir: string
): Promise<void> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(dirPath, entry.name)
    const renderedName = renderTemplate(entry.name, {
      projectName: answers.projectName,
    })
    const destPath = path.join(targetDir, renderedName)

    if (entry.isDirectory()) {
      await fs.ensureDir(destPath)
      await renderDir(srcPath, answers, destPath)
    } else {
      const ext = path.extname(entry.name)
      const isJson = ext === '.json'
      const isBinary = ['.svg', '.png', '.jpg', '.ico'].includes(ext)

      if (isBinary) {
        await fs.copy(srcPath, destPath)
      } else {
        const content = await fs.readFile(srcPath, 'utf-8')
        const vars = buildVars(answers)
        const rendered = isJson ? renderJson(content, vars) : renderTemplate(content, vars)
        await fs.writeFile(destPath, rendered)
      }
    }
  }
}

function buildVars(answers: UserAnswers): Record<string, any> {
  return {
    projectName: answers.projectName,
    description: answers.description,
    permissions: answers.permissions,
    contentScriptMatches: answers.contentScriptMatches,
    withInsertScript: answers.withInsertScript,
    withPopup: answers.withPopup,
    packageManager: answers.packageManager,
    hasPopup: answers.withPopup,
    hasInsert: answers.withInsertScript,
  }
}
