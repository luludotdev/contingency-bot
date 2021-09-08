import 'source-map-support/register.js'

import { field } from '@lolpants/jogger'
import { Client, Intents } from 'discord.js'
import { help } from '~commands/help.js'
import type { CommandParameters } from '~commands/index.js'
import { startVote } from '~commands/startVote.js'
import { Colours, PREFIX, VoteResult } from '~constants.js'
import { GUILD_ID, TOKEN } from '~env/index.js'
import type { HandlerParameters } from '~interactions/index.js'
import { parseInteractionID } from '~interactions/index.js'
import { init__cancel } from '~interactions/init/cancel.js'
import { init__confirm } from '~interactions/init/confirm.js'
import { generateEmbed } from '~interactions/init/utils.js'
import { vote__approve } from '~interactions/vote/approve.js'
import { vote__cancel } from '~interactions/vote/cancel.js'
import { vote__revoke } from '~interactions/vote/revoke.js'
import { generateVoteButtons } from '~interactions/vote/utils.js'
import { errorField, flush, logger } from '~logger.js'
import { createManager } from '~manager.js'
import { sweepCache, syncMembers } from '~utils.js'
import { exitHook } from './exit.js'

const manager = createManager()
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
  ],
})

client.on('ready', async () => {
  logger.info(
    field('action', 'ready'),
    field('user', client.user?.tag ?? 'Unknown')
  )

  await syncMembers(client)
  await sweepCache(client)
})

client.on('messageCreate', async message => {
  if (message.author.bot) return
  if (message.guild === null) return
  if (message.member === null) return
  if (message.guild.id !== GUILD_ID) return
  if (manager.canInitiate(message.member) === false) return

  if (!message.content.toLowerCase().startsWith(PREFIX)) return
  const [command, ...contentArray] = message.content
    .slice(PREFIX.length)
    .split(' ')

  if (command === '') return
  const content = contentArray.join(' ')

  const parameters: CommandParameters = {
    message,
    guild: message.guild,
    content,
    client,
    manager,
  }

  switch (command.toLowerCase()) {
    case 'startvote':
      await startVote(parameters)
      break

    case 'help':
      await help(parameters)
      break

    default: {
      logger.debug(
        field('event', 'messageCreate'),
        field('command', command.toLowerCase()),
        field('error', 'unhandled command')
      )

      break
    }
  }
})

client.on('interactionCreate', async button => {
  if (!button.isButton()) return
  if (button.guildId !== GUILD_ID) return

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

    case 'vote@approve':
      await vote__approve(parameters)
      break

    case 'vote@cancel':
      await vote__cancel(parameters)
      break

    case 'vote@revoke':
      await vote__revoke(parameters)
      break

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

client.on('messageDelete', async message => {
  const vote = manager.getVote(message.id)
  if (vote === undefined) return

  const description = `${vote.initiator} has started a vote to strip roles from ${vote.target}`
  const embed = generateEmbed({
    description,
    progress: vote.progress,
    votes: vote.voterList,
  })

  const mentions = vote.mentions.join(' ')
  const buttons = generateVoteButtons({ cancelData: [vote.initiator.id] })
  const newMessage = await message.channel.send({
    content: mentions,
    embeds: [embed],
    components: [buttons],
  })

  vote.replaceMessage(newMessage)
  logger.info(
    field('context', 'vote'),
    field('action', 'message-replaced'),
    field('oldID', message.id),
    field('newID', newMessage.id)
  )
})

const expireInterval = setInterval(async () => {
  // Wait for client to be ready
  if (client.readyAt === null) return

  const expired = manager.getExpired()
  if (expired.length === 0) return

  logger.info(
    field('action', 'sweep-expired'),
    field('expired-count', expired.length)
  )

  for (const vote of expired) {
    const embed = vote.message.embeds[0]
    embed.setDescription(`~~${embed.description}~~\n**${VoteResult.EXPIRED}**`)
    embed.setColor(Colours.GREY)

    const buttons = generateVoteButtons({ disabled: true })

    // eslint-disable-next-line no-await-in-loop
    await vote.message.edit({
      embeds: [embed],
      components: [buttons],
    })

    vote.cancel(null)
    logger.info(
      field('context', 'vote'),
      field('action', 'expired'),
      field('id', vote.message.id)
    )
  }
}, 1000 * 60)

const sweepInterval = setInterval(async () => {
  // Wait for client to be ready
  if (client.readyAt === null) return

  await sweepCache(client)
}, 1000 * 90)

exitHook(async (exit, error) => {
  clearInterval(expireInterval)
  clearInterval(sweepInterval)
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
