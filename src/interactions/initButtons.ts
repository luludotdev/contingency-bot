import { createField, field } from '@lolpants/jogger'
import { type ButtonInteraction } from 'discord.js'
import { ButtonComponent, Discord } from 'discordx'
import { setTimeout } from 'node:timers/promises'
import { generateInitButtons, generateVoteButtons } from '~/lib/buttons.js'
import { Reply } from '~/lib/constants.js'
import { generateEmbed } from '~/lib/embeds.js'
import { interactionRX, parseInteractionID } from '~/lib/interactions.js'
import { manager } from '~/lib/manager.js'
import { generateMentions } from '~/lib/vote/utils.js'
import { ctxField, logger } from '~/logger.js'

const context = ctxField('initButtons')
const traceFn = createField('fn')
const trace = createField('trace')

const cancelConfirmation = async (
  button: ButtonInteraction,
  editMessage: string,
  delay = 5000
) => {
  const buttons = generateInitButtons({ disabled: true })
  await button.update({ content: editMessage, components: [buttons] })

  await setTimeout(delay)

  const message = button.channel?.messages.cache.get(button.message.id)
  if (message?.deletable) await message.delete()
}

@Discord()
export abstract class InitButtons {
  @ButtonComponent(interactionRX('init', 'confirm'))
  public async runConfirm(button: ButtonInteraction) {
    const fn = traceFn('runConfirm')

    if (!button.guild) throw new Error('missing guild')
    if (!button.channel) throw new Error('missing channel')

    const { key, components } = parseInteractionID(button.customId)
    const [userID, targetID] = components
    logger.trace(context, trace('parsed custom id'))

    if (button.user.id !== userID) {
      logger.trace(context, fn, trace('vote confirmed by incorrect user'))
      await button.reply({
        content: Reply.ERR_NOT_INITIATOR_CONFIRM,
        ephemeral: true,
      })

      return false
    }

    if (!targetID) {
      logger.trace(context, fn, trace('no target id'))
      await cancelConfirmation(button, Reply.ERR_GENERIC)

      logger.error(
        field('interaction', key),
        field('error', 'targetID === undefined')
      )

      return
    }

    const target = button.guild.members.cache.get(targetID)
    logger.trace(context, fn, trace('resolved target from id'))

    if (!target) {
      logger.trace(context, fn, trace('no target'))

      await cancelConfirmation(button, Reply.ERR_GENERIC)
      logger.error(field('interaction', key), field('error', 'target === null'))

      return
    }

    logger.trace(context, fn, trace('deleting original message'))
    const btnMessage = button.message
    await btnMessage.delete()
    logger.trace(context, fn, trace('deleted original message'))

    await button.channel.sendTyping()

    logger.trace(context, fn, trace('generating mentions'))
    const mentionsArray = await generateMentions(button.guild.roles, target)
    const mentions = mentionsArray.join(' ')
    logger.trace(context, fn, trace('generated mentions'))

    const message = await button.channel.send({
      content: `**EMERGENCY ALERT:** ${mentions}`,
    })

    logger.trace(context, fn, trace('starting vote'))
    const initiator = button.guild.members.cache.get(button.user.id)!
    const vote = await manager.startVote(message, initiator, target)

    logger.info(
      context,
      field('action', 'start'),
      field('id', vote.message.id),
      field('initiator', initiator.user.tag),
      field('initiatorID', initiator.id),
      field('target', target.user.tag),
      field('targetID', target.id)
    )

    logger.info(
      context,
      field('action', 'approve'),
      field('id', vote.message.id),
      field('user', button.user.tag),
      field('userID', button.user.id),
      field('progress', vote.progress)
    )

    const description = `${initiator} has started a vote to strip roles from ${target}`
    const embed = generateEmbed({
      description,
      progress: vote.progress,
      votes: vote.voterList,
    })

    const buttons = generateVoteButtons({ cancelData: [userID] })
    await message.edit({
      embeds: [embed],
      components: [buttons],
    })
  }

  @ButtonComponent(interactionRX('init', 'cancel'))
  public async runCancel(button: ButtonInteraction) {
    if (!button.channel) throw new Error('missing channel')

    const { components } = parseInteractionID(button.customId)
    const [userID] = components

    if (button.user.id !== userID) {
      await button.reply({
        content: Reply.ERR_NOT_INITIATOR_CANCEL,
        ephemeral: true,
      })

      return false
    }

    await cancelConfirmation(button, Reply.VOTE_CANCELLED, 1500)
  }
}
