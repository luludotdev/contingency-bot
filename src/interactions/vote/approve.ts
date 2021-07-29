import { field } from '@lolpants/jogger'
import { DiscordAPIError } from 'discord.js'
import { Colours, Reply, VoteResult } from '~constants.js'
import { DRY_RUN } from '~env/index.js'
import type { Handler } from '~interactions/index.js'
import { logger } from '~logger.js'
import { cancelVote } from './utils.js'

export const vote__approve: Handler = async ({ manager, button }) => {
  const messageID = button.message.id
  const vote = manager.getVote(messageID)

  if (vote === undefined) {
    const embed = button.message.embeds[0]
    embed.setDescription(`~~${embed.description}~~\n**${VoteResult.EXPIRED}**`)
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
    await reply(Reply.ERR_IS_TARGET)
    return
  }

  if (!vote.canVote(member)) {
    await reply(Reply.ERR_NO_PERM)
    return
  }

  if (vote.hasVoted(member)) {
    await reply(Reply.ALREADY_VOTED)
    return
  }

  await button.reply.defer(true)
  vote.approve(button.clicker.member)

  logger.info(
    field('context', 'vote'),
    field('action', 'approve'),
    field('id', vote.message.id),
    field('user', button.clicker.member.user.tag),
    field('userID', button.clicker.member.id),
    field('progress', vote.progress)
  )

  const embed = button.message.embeds[0]
  embed.fields[0].value = vote.progress
  embed.fields[1].value = vote.voterList

  if (vote.isMet) {
    embed.setDescription(`~~${embed.description}~~\n**${VoteResult.PASSED}**`)

    vote.cancel(null)
    await cancelVote(button, embed, false)

    logger.info(
      field('context', 'vote'),
      field('action', 'passed'),
      field('id', vote.message.id)
    )

    try {
      if (DRY_RUN === false) {
        await vote.target.roles.remove(
          vote.target.roles.cache,
          `Emergency vote called by ${vote.initiator.user.tag}`
        )
      } else {
        // Check permissions anyway
        const hasPerms = vote.message.guild?.me?.hasPermission('MANAGE_ROLES')
        if (hasPerms === false) {
          throw new CustomError('Missing Permissions')
        }
      }

      embed.setColor(Colours.GREEN)
      embed.setDescription(
        `${embed.description}\n\nAll roles removed from ${vote.target} successfully!`
      )
    } catch (error: unknown) {
      embed.setColor(Colours.GREY)
      embed.setDescription(
        `${embed.description}\n\nFailed to remove roles from ${vote.target}`
      )

      if (error instanceof DiscordAPIError || error instanceof CustomError) {
        embed.setDescription(`${embed.description}\n**${error.message}.**`)
      }
    }
  }

  await button.message.edit({ embed })
}

class CustomError extends Error {}
