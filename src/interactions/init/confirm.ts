import { field } from '@lolpants/jogger'
import { Reply } from '~constants.js'
import type { Handler } from '~interactions/index.js'
import { generateVoteButtons } from '~interactions/vote/utils.js'
import { logger } from '~logger.js'
import { generateMentions, resolveMessage } from '~utils.js'
import { cancelConfirmation, checkUserID, generateEmbed } from './utils.js'

export const init__confirm: Handler = async ({
  manager,
  button,
  key,
  components,
}) => {
  if (!button.guild) throw new Error('missing guild')
  if (!button.channel) throw new Error('missing channel')

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

  const target = button.guild.members.cache.get(targetID)
  if (!target) {
    await cancelConfirmation(button, Reply.ERR_GENERIC)
    logger.error(field('interaction', key), field('error', 'target === null'))

    return
  }

  const btnMessage = await resolveMessage(button.channel, button.message, true)
  await btnMessage.delete()

  const mentionsArray = await generateMentions(button.guild.roles, target)
  const mentions = mentionsArray.join(' ')

  const message = await button.channel.send({
    content: `**EMERGENCY ALERT:** ${mentions}`,
  })

  const initiator = button.guild.members.cache.get(button.user.id)!
  const vote = await manager.startVote(message, initiator, target)

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
