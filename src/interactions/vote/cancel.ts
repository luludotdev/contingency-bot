import { field } from '@lolpants/jogger'
import { Colours, VoteResult } from '~constants.js'
import type { Handler } from '~interactions/index.js'
import { logger } from '~logger.js'
import { resolveMessage } from '~utils.js'
import { cancelVote } from './utils.js'

export const vote__cancel: Handler = async ({ manager, button }) => {
  if (!button.guild) throw new Error('missing guild')
  if (!button.channel) throw new Error('missing channel')

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
  if (!member) throw new Error('missing member')

  if (!vote.isInitiator(member)) {
    await button.reply({
      content: 'Only the user who started the vote can cancel.',
      ephemeral: true,
    })

    return
  }

  const embed = message.embeds[0]
  embed.setDescription(`~~${embed.description}~~\n**${VoteResult.CANCELLED}**`)
  embed.setColor(Colours.GREY)

  vote.cancel(member)
  await cancelVote(button, embed)

  logger.info(
    field('context', 'vote'),
    field('action', 'cancel'),
    field('id', vote.message.id)
  )
}
