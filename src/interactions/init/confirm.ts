import { field } from '@lolpants/jogger'
import { MessageButton } from 'discord-buttons'
import type { Role } from 'discord.js'
import { Reply } from '~constants.js'
import { ROLE_WEIGHTS } from '~env/index.js'
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
    await cancelConfirmation(button, Reply.ERR_GENERIC)

    logger.error(
      field('interaction', key),
      field('error', 'targetID === undefined')
    )

    return
  }

  const target = button.guild.member(targetID)
  if (!target) {
    await cancelConfirmation(button, Reply.ERR_GENERIC)
    logger.error(field('interaction', key), field('error', 'target === null'))

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

  const roles = [...ROLE_WEIGHTS.keys()]
    .map(id => button.guild.roles.resolve(id))
    .filter((role): role is Role => role !== null)
    .sort((a, b) => b.position - a.position)

  const notMentionable = roles.filter(role => !role.mentionable)
  for (const role of notMentionable) {
    // eslint-disable-next-line no-await-in-loop
    await role.setMentionable(true)
  }

  const rolesString = roles.map(role => role.toString()).join(' ')
  const message = await button.message.channel.send(rolesString)

  for (const role of notMentionable) {
    // eslint-disable-next-line no-await-in-loop
    await role.setMentionable(false)
  }

  const initiator = button.clicker.member
  const vote = manager.startVote(message, initiator, target)

  const description = `${initiator} has started a vote to strip roles from ${target}`
  const embed = generateEmbed({
    description,
    progress: vote.progress,
    votes: vote.voterList,
  })

  await message.edit({
    embed,
    // @ts-expect-error
    buttons: [approveButton, revokeButton, cancelButton],
  })
}
