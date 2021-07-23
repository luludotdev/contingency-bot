import { field } from '@lolpants/jogger'
import { MessageButton } from 'discord-buttons'
import { interactionID } from '~interactions/index.js'
import type { Handler } from '~interactions/index.js'
import { logger } from '~logger.js'
import { cancelConfirmation, checkUserID, generateEmbed } from './utils.js'

export const init__confirm: Handler = async ({
  manager,
  button,
  key,
  components,
}) => {
  const [userID, targetID] = components

  const isUser = await checkUserID(button, userID)
  if (!isUser) return

  if (!targetID) {
    await cancelConfirmation(
      button,
      'An error occurred, please check the bot log.'
    )

    logger.error(
      field('interaction', key),
      field('error', 'targetID === undefined')
    )

    return
  }

  const target = button.guild.member(targetID)
  if (!target) {
    await cancelConfirmation(
      button,
      'An error occurred, please check the bot log.'
    )

    logger.error(field('interaction', key), field('error', 'target === null'))
    return
  }

  if (manager.voteInProgress()) {
    await cancelConfirmation(button, 'A vote is already in progress.')
    return
  }

  await button.reply.defer(true)
  await button.message.delete()

  const approveButton = new MessageButton()
    .setLabel('Approve')
    .setID(interactionID('vote', 'approve'))
    .setStyle('blurple')

  const revokeButton = new MessageButton()
    .setLabel('Revoke Approval')
    .setID(interactionID('vote', 'revoke'))
    .setStyle('gray')

  const cancelButton = new MessageButton()
    .setLabel('Cancel')
    .setID(interactionID('vote', 'cancel', userID))
    .setStyle('red')

  const initiator = button.clicker.member
  const description = `${initiator} has started a vote to strip roles from ${target}.`
  const embed = generateEmbed({ description })

  await manager.startVote(initiator, target)
  await button.message.channel.send({
    embed,
    buttons: [approveButton, revokeButton, cancelButton],
  })
}
