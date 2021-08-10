import type { UserResolvable } from 'discord.js'
import type { Command } from '~commands/index.js'
import { DRY_RUN_RICH, Reply } from '~constants.js'
import { generateInitButtons } from '~interactions/init/utils.js'

export const startVote: Command = async ({
  message,
  content,
  guild,
  client,
  manager,
}) => {
  const targetID = content.replace(/<@!?(\d+)>/, '$1')
  if (targetID === '') {
    await message.reply(Reply.ERR_NO_ID)
    return
  }

  const fetchTarget = async (user: UserResolvable) => {
    try {
      const target = await guild.members.fetch(user)
      return target
    } catch {
      return undefined
    }
  }

  const target = await fetchTarget(targetID)
  if (target === undefined) {
    await message.reply(Reply.ERR_UNKNOWN_USER)
    return
  }

  if (target.id === client.user?.id) {
    await message.reply(Reply.ERR_IS_BOT)
    return
  }

  if (target.id === message.author.id) {
    await message.reply(Reply.ERR_IS_SELF)
    return
  }

  const botRolePosition = guild.me?.roles.highest.position ?? -1
  const targetRolePosition = target.roles.highest.position
  if (botRolePosition <= targetRolePosition) {
    await message.reply(Reply.ERR_TARGET_HIGHER)
    return
  }

  const inProgress = manager.voteInProgress(target)
  if (inProgress !== undefined) {
    await message.reply(`${Reply.ERR_IN_PROGRESS}\n${inProgress.message.url}`)
    return
  }

  const buttons = generateInitButtons({
    confirmData: [message.author.id, target.id],
    cancelData: [message.author.id, message.id],
  })

  await message.channel.send({
    content: `${DRY_RUN_RICH}Are you sure you want to start a vote against \`${target.user.tag}\`?`,
    components: [buttons],
  })
}
