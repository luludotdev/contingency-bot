import '@lolpants/env/register.js'

import { defineEnvironment, t } from '@lolpants/env'
import ms from 'ms'

export const roleMap = (v: string) => {
  const split = v.split(';').map(entry => entry.split(','))

  const mapped: Array<[roleID: string, weight: number]> = split.map(
    ([key, value]) => [key, Number.parseInt(value, 10)]
  )

  const roleRX = /^\d+$/
  for (const [roleID, weight] of mapped) {
    if (!roleRX.test(roleID)) {
      throw new TypeError(`roleID \`${roleID}\` is invalid!`)
    }

    if (Number.isNaN(weight)) {
      throw new TypeError(`weight for \`${roleID}\` is not a number!`)
    }

    if (weight < 0) {
      throw new TypeError(`weight for \`${roleID}\` must be greater than 0!`)
    }
  }

  return new Map(mapped)
}

export const env = defineEnvironment({
  // #region Globals
  NODE_ENV: t.string(),

  DEBUG_LOGS: t.bool(),
  GIT_VERSION: t.string(),
  // #endregion

  // #region Bot
  TOKEN: t.string().required(),
  GUILD_ID: t.string().required(),
  DRY_RUN: t.bool().default(false),
  // #endregion

  // #region Roles
  ROLE_WEIGHTS: t
    .string()
    .required()
    .validate(v => {
      try {
        const _ = roleMap(v)
      } catch (error: unknown) {
        if (error instanceof Error) return error.message
      }
    }),

  VOTING_WEIGHT: t.int().required(),
  TARGET_SCORE: t.int().required(),
  // #endregion

  MAX_VOTE_LIFETIME: t
    .string()
    .default('60m')
    .validate(v => {
      const parsed = ms(v)
      if (parsed === undefined) {
        return `Lifetime \`${v}\` is invalid!`
      }

      if (parsed < ms('5m')) {
        return 'Vote lifetime must be greater than 5 minutes!'
      }
    }),
})

const IS_PROD = env.NODE_ENV?.toLowerCase() === 'production'
export const IS_DEV = !IS_PROD
