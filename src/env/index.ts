import ms from 'ms'
import { registerInt, registerString } from './register.js'

// #region Globals
const NODE_ENV = registerString('NODE_ENV')
const IS_PROD = NODE_ENV?.toLowerCase() === 'production'
export const IS_DEV = !IS_PROD
// #endregion

// #region Bot
export const TOKEN = registerString('TOKEN', true)
export const GUILD_ID = registerString('GUILD_ID', true)
// #endregion

// #region Roles
const roleWeights = registerString('ROLE_WEIGHTS', true)
const split = roleWeights.split(';').map(entry => entry.split(','))

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

const weightMap = new Map(mapped)
export { weightMap as ROLE_WEIGHTS }

export const VOTING_WEIGHT = registerInt('VOTING_WEIGHT', true)
export const TARGET_SCORE = registerInt('TARGET_SCORE', true)
// #endregion

// #region Vote Lifetimes
const maxVoteLifetime = registerString('MAX_VOTE_LIFETIME') ?? '60m'
const voteLifeMS = ms(maxVoteLifetime)
if (voteLifeMS === undefined) {
  throw new TypeError(`lifetime \`${maxVoteLifetime}\` is invalid!`)
}

export { voteLifeMS as MAX_VOTE_LIFETIME }
// #endregion
