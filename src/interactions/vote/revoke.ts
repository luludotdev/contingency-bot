import { field } from '@lolpants/jogger'
import { Colours, Reply, VoteResult } from '~constants.js'
import type { Handler } from '~interactions/index.js'
import { logger } from '~logger.js'
import { cancelVote } from './utils.js'

export const vote__revoke: Handler = async ({ manager, button }) => {
  const messageID = button.message.id
  const vote = manager.getVote(messageID)

  if (vote === undefined) {
    const embed = button.message.embeds[0]
    embed.setDescription(`~~${embed.description}~~\n**${VoteResult.EXPIRED}**`)
    embed.setColor(Colours.GREY)

    await cancelVote(button, embed)
    return
  }

  const member = button.clicker.member
  const reply = async (message: string) => {
    await button.reply.send(
      message,
      // @ts-expect-error
      true
    )
  }

  if (!vote.canVote(member)) {
    await reply(Reply.ERR_NO_PERM)
    return
  }

  if (!vote.hasVoted(member)) {
    await reply(Reply.NOT_VOTED)
    return
  }

  await button.reply.defer(true)
  vote.revoke(button.clicker.member)

  logger.info(
    field('context', 'vote'),
    field('action', 'revoke'),
    field('id', vote.message.id),
    field('user', button.clicker.member.user.tag),
    field('userID', button.clicker.member.id),
    field('progress', vote.progress)
  )

  const embed = button.message.embeds[0]
  embed.fields[0].value = vote.progress
  embed.fields[1].value = vote.voterList

  await button.message.edit({ embed })
}
