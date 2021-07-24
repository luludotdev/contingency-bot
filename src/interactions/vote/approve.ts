import { Colours } from '~constants.js'
import type { Handler } from '~interactions/index.js'
import { cancelVote } from './utils.js'

export const vote__approve: Handler = async ({ manager, button }) => {
  const messageID = button.message.id
  const vote = manager.getVote(messageID)

  if (vote === undefined) {
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

  if (vote.isTarget(member)) {
    await reply('You may not approve as you are the target of this vote.')
    return
  }

  if (!vote.canVote(member)) {
    await reply('You are not allowed to do that.')
    return
  }

  if (vote.hasVoted(member)) {
    await reply('You have already voted!')
    return
  }

  await button.reply.defer(true)
  vote.approve(button.clicker.member)

  const embed = button.message.embeds[0]
  embed.fields[0].value = vote.progress
  embed.fields[1].value = vote.voterList

  if (vote.isMet) {
    embed.description = `~~${embed.description}~~\nVote passed.`
    embed.color = Colours.GREEN

    vote.cancel(null)
    await cancelVote(button, embed, false)
  } else {
    await button.message.edit({ embed })
  }
}
