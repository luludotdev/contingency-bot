import { field } from '@lolpants/jogger'
import type { Role } from 'discord.js'
import { Reply } from '~constants.js'
import { ROLE_WEIGHTS } from '~env/index.js'
import type { Handler } from '~interactions/index.js'
import { generateVoteButtons } from '~interactions/vote/utils.js'
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

  logger.info(
    field('context', 'vote'),
    field('action', 'start'),
    field('id', vote.message.id),
    field('initiator', initiator.user.tag),
    field('initiatorID', initiator.id),
    field('target', target.user.tag),
    field('targetID', target.id)
  )

  logger.info(
    field('context', 'vote'),
    field('action', 'approve'),
    field('id', vote.message.id),
    field('user', button.clicker.member.user.tag),
    field('userID', button.clicker.member.id),
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
    embed,
    // @ts-expect-error
    buttons,
  })
}
