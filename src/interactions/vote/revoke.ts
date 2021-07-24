import { Colours } from '~constants.js'
import type { Handler } from '~interactions/index.js'
import { cancelVote } from './utils.js'

export const vote__revoke: Handler = async ({ manager, button }) => {
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

  if (!vote.canVote(member)) {
    await reply('You are not allowed to do that.')
    return
  }

  if (!vote.hasVoted(member)) {
    await reply('You have not voted!')
    return
  }

  await button.reply.defer(true)
  vote.revoke(button.clicker.member)

  const embed = button.message.embeds[0]
  embed.fields[0].value = vote.progress
  embed.fields[1].value = vote.voterList

  await button.message.edit({ embed })
}
