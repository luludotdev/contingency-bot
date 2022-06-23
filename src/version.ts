import { execa } from 'execa'
import { env } from '~/env.js'

export const getVersion: () => Promise<string> = async () => {
  if (env.GIT_VERSION) return env.GIT_VERSION

  try {
    const { stdout: gitVersion } = await execa('git rev-parse --short HEAD')
    const { stdout: status } = await execa('git status -s')
    const dev = status !== ''

    return dev ? `${gitVersion} (dev)` : gitVersion
  } catch {
    return 'unknown'
  }
}
