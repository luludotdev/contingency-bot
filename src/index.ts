import 'source-map-support/register.js'

import { field } from '@lolpants/jogger'
import { Client, Intents, MessageButton } from 'discord.js'
import { Colours, DRY_RUN_RICH, Reply, VoteResult } from '~constants.js'
import { GUILD_ID, TOKEN } from '~env/index.js'
import type { HandlerParameters } from '~interactions/index.js'
import { parseInteractionID } from '~interactions/index.js'
import { init__cancel } from '~interactions/init/cancel.js'
import { init__confirm } from '~interactions/init/confirm.js'
import { generateEmbed, generateInitButtons } from '~interactions/init/utils.js'
import { vote__approve } from '~interactions/vote/approve.js'
import { vote__cancel } from '~interactions/vote/cancel.js'
import { vote__revoke } from '~interactions/vote/revoke.js'
import { generateVoteButtons } from '~interactions/vote/utils.js'
import { errorField, flush, logger } from '~logger.js'
import { createManager } from '~manager.js'
import { exitHook } from './exit.js'

const manager = createManager()
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS]})

client.on('ready', async () => {
  logger.info(
    field('action', 'ready'),
    field('user', client.user?.tag ?? 'Unknown')
  )

  const guild = await client.guilds.fetch(GUILD_ID)
  const members = await guild.members.fetch({ limit: 500_000 })

  logger.info(field('action', 'sync-members'), field('members', members.size))
})

client.on('messageCreate', async message => {
  if (message.author.bot) return
  if (message.guild === null) return
  if (message.member === null) return
  if (message.guild.id !== GUILD_ID) return
  if (manager.canInitiate(message.member) === false) return

  const prefix = 'c!startvote '
  if (!message.content.toLowerCase().startsWith(prefix)) return

  const content = message.content.slice(prefix.length)
  const targetID = content.replace(/<@!?(\d+)>/, '$1')

  const target = message.guild.members.resolve(targetID)
  if (target === null) {
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

  const botRolePosition = message.guild.me?.roles.highest.position ?? -1
  const targetRolePosition = target.roles.highest.position
  if (botRolePosition <= targetRolePosition) {
    await message.reply(Reply.ERR_TARGET_HIGHER)
    return
  }

  const inProgress = manager.voteInProgress(target)
  if (inProgress !== undefined) {
    await message.reply(
      `${Reply.ERR_IN_PROGRESS}\n${inProgress.message.url}`
    )

    return
  }

  const buttons = generateInitButtons({
    confirmData: [message.author.id, target.id],
    cancelData: [message.author.id, message.id],
  })

  await message.channel.send({ content: `${DRY_RUN_RICH}Are you sure you want to start a vote against \`${target.user.tag}\`?`, components: [buttons] })
})

client.on('interactionCreate', async button => {
  if (!button.isButton()) return

  const interaction = parseInteractionID(button.customId)
  const { key, components } = interaction

  const parameters: HandlerParameters = {
    button,
    manager,
    key,
    components,
  }

  switch (key) {
    case 'init@cancel':
      await init__cancel(parameters)
      break

    case 'init@confirm':
      await init__confirm(parameters)
      break

    // case 'vote@approve':
    //   await vote__approve(parameters)
    //   break

    // case 'vote@cancel':
    //   await vote__cancel(parameters)
    //   break

    // case 'vote@revoke':
    //   await vote__revoke(parameters)
    //   break

    default: {
      logger.error(
        field('event', 'clickButton'),
        field('interaction', interaction.key),
        field('error', 'unhandled interaction')
      )

      break
    }
  }
})

// client.on('messageDelete', async message => {
//   const vote = manager.getVote(message.id)
//   if (vote === undefined) return

//   const description = `${vote.initiator} has started a vote to strip roles from ${vote.target}`
//   const embed = generateEmbed({
//     description,
//     progress: vote.progress,
//     votes: vote.voterList,
//   })

//   const mentions = vote.mentions.join(' ')
//   const buttons = generateVoteButtons({ cancelData: [vote.initiator.id] })
//   const newMessage = await message.channel.send(mentions, { embed, buttons })

//   vote.replaceMessage(newMessage)
//   logger.info(
//     field('context', 'vote'),
//     field('action', 'message-replaced'),
//     field('oldID', message.id),
//     field('newID', newMessage.id)
//   )
// })

// const interval = setInterval(async () => {
//   // Wait for client to be ready
//   if (client.readyAt === null) return

//   const expired = manager.getExpired()
//   if (expired.length === 0) return

//   logger.info(
//     field('action', 'sweep-expired'),
//     field('expired-count', expired.length)
//   )

//   for (const vote of expired) {
//     const embed = vote.message.embeds[0]
//     embed.setDescription(`~~${embed.description}~~\n**${VoteResult.EXPIRED}**`)
//     embed.setColor(Colours.GREY)

//     const buttons = generateVoteButtons({ disabled: true })

//     // eslint-disable-next-line no-await-in-loop
//     await vote.message.edit({
//       embed,
//       // @ts-expect-error
//       buttons,
//     })

//     vote.cancel(null)
//     logger.info(
//       field('context', 'vote'),
//       field('action', 'expired'),
//       field('id', vote.message.id)
//     )
//   }
// }, 1000 * 60)

exitHook(async (exit, error) => {
  // clearInterval(interval)
  client.destroy()

  if (error) {
    logger.error(errorField(error))
  } else {
    logger.info(field('action', 'shutdown'))
  }

  await flush()
  exit()
})

void client.login(TOKEN)
