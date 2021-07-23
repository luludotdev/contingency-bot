import { Colours } from '~constants.js'
import type { Handler } from '~interactions/index.js'
import { cancelVote } from './utils.js'

export const vote__approve: Handler = async ({ manager, button }) => {
  if (!manager.voteInProgress()) {
    const embed = button.message.embeds[0]
    embed.setDescription(`~~${embed.description}~~\n**This vote has expired.**`)
    embed.setColor(Colours.GREY)

    await cancelVote(button, embed)
    return
  }

  if (manager.isTarget(button.clicker.member)) {
    await button.reply.send(
      'You may not approve as you are the target of this vote.',
      // @ts-expect-error
      true
    )

    return
  }

  // TODO
  console.log('vote@approve')
}
