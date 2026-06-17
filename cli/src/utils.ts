import { execa } from 'execa'
import pc from 'picocolors'
import { type UserAnswers } from './prompts.js'

export async function installDependencies(
  targetDir: string,
  packageManager: UserAnswers['packageManager']
): Promise<void> {
  console.log(pc.dim('\n📦 Installing dependencies...'))

  try {
    const installCmd =
      packageManager === 'npm'
        ? 'install'
        : packageManager === 'yarn'
          ? 'install'
          : 'install'

    await execa(packageManager, [installCmd], {
      cwd: targetDir,
      stdio: 'pipe',
    })

    console.log(pc.green('✓ Dependencies installed'))
  } catch (error: any) {
    console.log(pc.yellow('\n⚠ Failed to install dependencies automatically.'))
    console.log(pc.dim(`  You can run: cd ${targetDir} && ${packageManager} install`))
  }
}


