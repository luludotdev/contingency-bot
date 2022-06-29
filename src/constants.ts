export const enum Reply {
  ERR_IS_DM = 'This command cannot be run in DMs!',
  ERR_IS_BOT = 'You cannot start a vote against this bot!',
  ERR_IS_SELF = 'You cannot start a vote against yourself!',
  ERR_NOT_IN_GUILD = 'Target is not in the current server!',
  ERR_TARGET_HIGHER = 'Could not start a vote against that user due to role positions.',
}
