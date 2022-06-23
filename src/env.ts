import '@lolpants/env/register.js'
import { defineEnvironment, t } from '@lolpants/env'

export const env = defineEnvironment({
  // #region Globals
  NODE_ENV: t.string(),

  DEBUG_LOGS: t.bool(),
  GIT_VERSION: t.string(),
  // #endregion
})

const IS_PROD = env.NODE_ENV?.toLowerCase() === 'production'
export const IS_DEV = !IS_PROD
