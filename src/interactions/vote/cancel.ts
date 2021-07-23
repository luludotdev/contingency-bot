import { Colours } from '~constants.js'
import type { Handler } from '~interactions/index.js'
import { cancelVote } from './utils.js'

export const vote__cancel: Handler = async ({ manager, button }) => {
  if (!manager.voteInProgress()) {
    const embed = button.message.embeds[0]
    embed.setDescription(`~~${embed.description}~~\n**This vote has expired.**`)
    embed.setColor(Colours.GREY)

    await cancelVote(button, embed)
    return
  }

  if (!manager.isInitiator(button.clicker.member)) {
    await button.reply.send(
      'Only the user who started the vote can cancel.',
      // @ts-expect-error
      true
    )

    return
  }

  const embed = button.message.embeds[0]
  embed.setDescription(`~~${embed.description}~~\n**This vote was cancelled.**`)
  embed.setColor(Colours.GREY)

  await cancelVote(button, embed)
}
