import { field } from '@lolpants/jogger'
import { type ButtonInteraction, Message, type MessageEmbed } from 'discord.js'
import { ButtonComponent, Discord } from 'discordx'
import { Colours, VoteResult } from '~/constants.js'
import { generateVoteButtons } from '~/lib/buttons.js'
import { interactionRX } from '~/lib/interactions.js'
import { manager } from '~/lib/manager.js'
import { logger } from '~/logger.js'

export const cancelVote = async (
  button: ButtonInteraction,
  embed: MessageEmbed
) => {
  const buttons = generateVoteButtons({ disabled: true })
  await button.update({ embeds: [embed], components: [buttons] })
}

@Discord()
export abstract class VoteButtons {
  @ButtonComponent(interactionRX('vote', 'approve'))
  public async runApprove(button: ButtonInteraction) {
    // TODO
  }

  @ButtonComponent(interactionRX('vote', 'revoke'))
  public async runRevoke(button: ButtonInteraction) {
    // TODO
  }

  @ButtonComponent(interactionRX('vote', 'cancel'))
  public async runCancel(button: ButtonInteraction) {
    if (!button.guild) throw new Error('missing guild')
    if (!button.channel) throw new Error('missing channel')

    const message =
      button.message instanceof Message
        ? button.message
        : await button.channel.messages.fetch(button.message.id)

    const messageID = button.message.id
    const vote = manager.getVote(messageID)

    if (vote === undefined) {
      const embed = message.embeds[0]
      embed.setColor(Colours.GREY)
      embed.setDescription(
        `~~${embed.description}~~\n**${VoteResult.EXPIRED}**`
      )

      await cancelVote(button, embed)
      return
    }

    const member = button.guild.members.cache.get(button.user.id)
    if (!member) throw new Error('missing member')

    if (!vote.isInitiator(member)) {
      await button.reply({
        // TODO: Extract text
        content: 'Only the user who started the vote can cancel.',
        ephemeral: true,
      })

      return
    }

    const embed = message.embeds[0]
    embed.setColor(Colours.GREY)
    embed.setDescription(
      `~~${embed.description}~~\n**${VoteResult.CANCELLED}**`
    )

    vote.cancel(member)
    await cancelVote(button, embed)

    logger.info(
      field('context', 'vote'),
      field('action', 'cancel'),
      field('id', vote.message.id)
    )
  }
}
