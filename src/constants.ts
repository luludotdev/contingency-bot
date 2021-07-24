export const enum Colours {
  RED = 0xed_42_45,
  GREY = 0x4f_54_5c,
  GREEN = 0x3b_a5_5d,
}

export const enum VoteResult {
  EXPIRED = 'This vote has expired.',
  CANCELLED = 'This vote was cancelled.',
  PASSED = 'Vote passed.',
}

export const enum Reply {
  ERR_NO_PERM = 'You are not allowed to do that.',
  ERR_IS_TARGET = 'You may not approve as you are the target of this vote.',
  ALREADY_VOTED = 'You have already voted!',
  NOT_VOTED = 'You have not voted!',
  ERR_GENERIC = 'An error occurred, please check the bot log.',
  VOTE_CANCELLED = 'Vote Cancelled.',
  ERR_UNKNOWN_USER = 'Could not resolve a user with that ID!',
  ERR_IS_SELF = 'You cannot start a vote against yourself!',
  ERR_IN_PROGRESS = 'A vote against that user is already in progress!',
  ERR_NOT_INITIATOR = 'Only the user who started the vote can confirm or cancel.',
}
