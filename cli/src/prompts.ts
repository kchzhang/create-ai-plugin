import prompts, { type PromptObject } from 'prompts'
import pc from 'picocolors'

export interface UserAnswers {
  projectName: string
  description: string
  permissions: string[]
  contentScriptMatches: string[]
  withInsertScript: boolean
  withPopup: boolean
  packageManager: 'pnpm' | 'npm' | 'yarn'
}

const DEFAULTS: Omit<UserAnswers, 'projectName' | 'description'> = {
  permissions: ['storage'],
  contentScriptMatches: ['<all_urls>'],
  withInsertScript: true,
  withPopup: true,
  packageManager: 'pnpm',
}

export async function promptUser(projectDir?: string): Promise<UserAnswers> {
  console.log()
  console.log(pc.cyan('🧩 Create AI Chrome Plugin'))
  console.log(pc.dim('  Scaffold a Chrome Extension with Vue 3 + Vite + TypeScript'))
  console.log()

  const questions: PromptObject[] = [
    {
      type: projectDir ? null : 'text',
      name: 'projectName',
      message: 'Project name',
      initial: 'my-chrome-plugin',
    },
    {
      type: 'text',
      name: 'description',
      message: 'Description',
      initial: 'A Chrome Extension built with Vue 3 + Vite + TypeScript',
    },
  ]

  const onCancel = () => {
    console.log(pc.red('\n✖ Operation cancelled'))
    process.exit(1)
  }

  const answers = await prompts(questions, { onCancel })

  if (projectDir) {
    answers.projectName = projectDir
  }

  return { ...DEFAULTS, ...answers } as UserAnswers
}
