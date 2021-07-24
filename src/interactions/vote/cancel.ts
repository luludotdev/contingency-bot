import { field } from '@lolpants/jogger'
import { Colours, VoteResult } from '~constants.js'
import type { Handler } from '~interactions/index.js'
import { logger } from '~logger.js'
import { cancelVote } from './utils.js'

export const vote__cancel: Handler = async ({ manager, button }) => {
  const messageID = button.message.id
  const vote = manager.getVote(messageID)

  if (vote === undefined) {
    const embed = button.message.embeds[0]
    embed.setDescription(`~~${embed.description}~~\n**${VoteResult.EXPIRED}**`)
    embed.setColor(Colours.GREY)

    await cancelVote(button, embed)
    return
  }

  if (!vote.isInitiator(button.clicker.member)) {
    await button.reply.send(
      'Only the user who started the vote can cancel.',
      // @ts-expect-error
      true
    )

    return
  }

  const embed = button.message.embeds[0]
  embed.setDescription(`~~${embed.description}~~\n**${VoteResult.CANCELLED}**`)
  embed.setColor(Colours.GREY)

  vote.cancel(button.clicker.member)
  await cancelVote(button, embed)

  logger.info(
    field('context', 'vote'),
    field('action', 'cancel'),
    field('id', vote.message.id)
  )
}
