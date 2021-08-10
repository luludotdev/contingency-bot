import { field } from '@lolpants/jogger'
import { Colours, Reply, VoteResult } from '~constants.js'
import type { Handler } from '~interactions/index.js'
import { logger } from '~logger.js'
import { resolveMessage } from '~utils.js'
import { cancelVote } from './utils.js'

export const vote__revoke: Handler = async ({ manager, button }) => {
  if (!button.guild) return
  if (!button.channel) return

  const message = await resolveMessage(button.channel, button.message, true)
  const messageID = button.message.id
  const vote = manager.getVote(messageID)

  if (vote === undefined) {
    const embed = message.embeds[0]
    embed.setDescription(`~~${embed.description}~~\n**${VoteResult.EXPIRED}**`)
    embed.setColor(Colours.GREY)

    await cancelVote(button, embed)
    return
  }

  const member = button.guild.members.cache.get(button.user.id)
  if (!member) return

  const reply = async (message: string) => {
    await button.reply({ content: message, ephemeral: true })
  }

  if (!vote.canVote(member)) {
    await reply(Reply.ERR_NO_PERM)
    return
  }

  if (!vote.hasVoted(member)) {
    await reply(Reply.NOT_VOTED)
    return
  }

  vote.revoke(member)
  logger.info(
    field('context', 'vote'),
    field('action', 'revoke'),
    field('id', vote.message.id),
    field('user', member.user.tag),
    field('userID', member.id),
    field('progress', vote.progress)
  )

  const embed = message.embeds[0]
  embed.fields[0].value = vote.progress
  embed.fields[1].value = vote.voterList

  await button.update({ embeds: [embed] })
}
