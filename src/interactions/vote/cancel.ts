import type { Handler } from '~interactions/index.js'
import { cancelVote } from './utils.js'

export const vote__cancel: Handler = async ({ manager, button }) => {
  if (!manager.voteInProgress()) {
    const embed = button.message.embeds[0]
    embed.setDescription(`~~${embed.description}~~\n**This vote has expired.**`)

    await cancelVote(button, embed)
  }
}
