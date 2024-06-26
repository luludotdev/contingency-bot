import { setTimeout } from 'node:timers/promises'
import { ButtonInteraction } from 'discord.js'
import { ButtonComponent, Discord } from 'discordx'
import { generateInitButtons, generateVoteButtons } from '~/lib/buttons.js'
import { Reply } from '~/lib/constants.js'
import { generateEmbed } from '~/lib/embeds.js'
import { interactionRX, parseInteractionID } from '~/lib/interactions.js'
import { manager } from '~/lib/manager.js'
import { generateMentions } from '~/lib/vote/utils.js'
import { action, context, createTrace, logger } from '~/logger.js'

const ctx = context('initButtons')

const cancelConfirmation = async (
  button: ButtonInteraction,
  editMessage: string,
  delay = 5_000,
) => {
  const buttons = generateInitButtons({ disabled: true })
  await button.update({ content: editMessage, components: [buttons] })

  await setTimeout(delay)

  const message = button.channel?.messages.cache.get(button.message.id)
  if (message?.deletable) await message.delete()
}

@Discord()
export abstract class InitButtons {
  @ButtonComponent({ id: interactionRX('init', 'confirm') })
  public async runConfirm(button: ButtonInteraction) {
    const trace = createTrace(ctx, 'runConfirm')

    if (!button.guild) throw new Error('missing guild')
    if (!button.channel) throw new Error('missing channel')

    const { key, components } = parseInteractionID(button.customId)
    const [userID, targetID] = components
    trace('parsed custom id')

    if (button.user.id !== userID) {
      trace('vote confirmed by incorrect user')
      await button.reply({
        content: Reply.ERR_NOT_INITIATOR_CONFIRM,
        ephemeral: true,
      })

      return
    }

    if (!targetID) {
      trace('no target id')
      await cancelConfirmation(button, Reply.ERR_GENERIC)

      logger.error({
        interaction: key,
        error: 'targetID === undefined',
      })

      return
    }

    const target = button.guild.members.cache.get(targetID)
    trace('resolved target from id')

    if (!target) {
      trace('no target')

      await cancelConfirmation(button, Reply.ERR_GENERIC)
      logger.error({
        interaction: key,
        error: 'target === null',
      })

      return
    }

    trace('deleting original message')
    const btnMessage = button.message
    await btnMessage.delete()
    trace('deleted original message')

    await button.channel.sendTyping()

    trace('generating mentions')
    const mentionsArray = await generateMentions(button.guild.roles, target)
    const mentions = mentionsArray.join(' ')
    trace('generated mentions')

    const message = await button.channel.send({
      content: `**EMERGENCY ALERT:** ${mentions}`,
    })

    trace('starting vote')
    const initiator = button.guild.members.cache.get(button.user.id)!
    const vote = await manager.startVote(message, initiator, target)

    logger.info({
      ...ctx,
      ...action('start'),
      id: vote.message.id,
      initiator: `@${initiator.user.username}`,
      initiatorID: initiator.id,
      target: `@${target.user.username}`,
      targetID: target.id,
    })

    logger.info({
      ...ctx,
      ...action('approve'),
      id: vote.message.id,
      user: `@${button.user.username}`,
      userID: button.user.id,
      progress: vote.progress,
    })

    const embed = generateEmbed({
      initiator,
      target,
      progress: vote.progress,
      votes: vote.voterList,
    })

    const buttons = generateVoteButtons({ cancelData: [userID] })
    await message.edit({
      embeds: [embed],
      components: [buttons],
    })
  }

  @ButtonComponent({ id: interactionRX('init', 'cancel') })
  public async runCancel(button: ButtonInteraction) {
    if (!button.channel) throw new Error('missing channel')

    const { components } = parseInteractionID(button.customId)
    const [userID] = components

    if (button.user.id !== userID) {
      await button.reply({
        content: Reply.ERR_NOT_INITIATOR_CANCEL,
        ephemeral: true,
      })

      return
    }

    await cancelConfirmation(button, Reply.VOTE_CANCELLED, 1_500)
  }
}
