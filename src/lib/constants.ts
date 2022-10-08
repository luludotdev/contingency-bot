import { env } from '~/env.js'

export const enum Colours {
  GREEN = 0x3b_a5_5d,
  GREY = 0x4f_54_5c,
  RED = 0xed_42_45,
}

const DRY_RUN_TEXT = '[Dry Run]'
export const DRY_RUN_PREFIX = () => (env.DRY_RUN ? `${DRY_RUN_TEXT} ` : '')
export const DRY_RUN_RICH = () => (env.DRY_RUN ? `**${DRY_RUN_TEXT}** ` : '')

export const enum VoteResult {
  CANCELLED = 'This vote was cancelled.',
  EXPIRED = 'This vote has expired.',
  PASSED = 'Vote passed.',
}

export const enum Reply {
  ALREADY_VOTED = 'You have already voted!',
  ERR_GENERIC = 'An error occurred, please check the bot log.',
  ERR_IN_PROGRESS = 'A vote against that user is already in progress!',

  ERR_IS_BOT = 'You cannot start a vote against this bot!',
  ERR_IS_DM = 'This command cannot be run in DMs!',
  ERR_IS_SELF = 'You cannot start a vote against yourself!',
  ERR_IS_TARGET = 'You may not approve as you are the target of this vote.',
  ERR_NOT_INITIATOR_CANCEL = 'Only the user who started the vote can cancel.',
  ERR_NOT_INITIATOR_CONFIRM = 'Only the user who started the vote can confirm.',
  ERR_NOT_IN_GUILD = 'Target is not in the current server!',
  ERR_NO_PERM = 'You are not allowed to do that.',
  ERR_TARGET_HIGHER = 'Could not start a vote against that user due to role positions.',
  NOT_VOTED = 'You have not voted!',
  VOTE_CANCELLED = 'Vote Cancelled.',
}
