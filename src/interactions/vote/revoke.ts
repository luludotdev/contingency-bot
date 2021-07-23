import type { Handler } from '~interactions/index.js'
import { cancelVote } from './utils.js'

export const vote__revoke: Handler = async ({ manager, button }) => {
  if (!manager.voteInProgress()) {
    const embed = button.message.embeds[0]
    embed.setDescription(`~~${embed.description}~~\n**This vote has expired.**`)
    embed.setColor(0x4f_54_5c)

    await cancelVote(button, embed)
  }
}
