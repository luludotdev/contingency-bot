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

  const member = button.clicker.member
  const reply = async (message: string) => {
    await button.reply.send(
      message,
      // @ts-expect-error
      true
    )
  }

  if (manager.isTarget(member)) {
    await reply('You may not approve as you are the target of this vote.')
    return
  }

  if (!manager.canVote(member)) {
    await reply('You are not allowed to do that.')
    return
  }

  if (manager.hasVoted(member)) {
    await reply('You have already voted!')
    return
  }

  await button.reply.defer(true)
  const vote = manager.castVote(button.clicker.member)

  const embed = button.message.embeds[0]
  embed.fields[0].value = vote.voters

  if (vote.isMet) {
    embed.description = `~~${embed.description}~~\nVote passed.`
    embed.color = Colours.GREEN

    manager.cancelVote()
    await cancelVote(button, embed, false)
  } else {
    await button.message.edit({ embed })
  }
}
