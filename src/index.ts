import 'source-map-support/register.js'
import 'discord-reply'

import { field } from '@lolpants/jogger'
import buttons, { MessageButton } from 'discord-buttons'
import { Client, Intents } from 'discord.js'
import { GUILD_ID, TOKEN } from '~env/index.js'
import type { HandlerParameters } from '~interactions/index.js'
import { interactionID, parseInteractionID } from '~interactions/index.js'
import { init__cancel } from '~interactions/init/cancel.js'
import { init__confirm } from '~interactions/init/confirm.js'
import { vote__approve } from '~interactions/vote/approve.js'
import { vote__cancel } from '~interactions/vote/cancel.js'
import { vote__revoke } from '~interactions/vote/revoke.js'
import { errorField, flush, logger } from '~logger.js'
import { createManager } from '~manager.js'
import { exitHook } from './exit.js'

const manager = createManager()
const client = new Client({ ws: { intents: Intents.ALL } })
buttons(client)

client.on('ready', async () => {
  logger.info(
    field('action', 'ready'),
    field('user', client.user?.tag ?? 'Unknown')
  )

  const guild = await client.guilds.fetch(GUILD_ID)
  const members = await guild.members.fetch({ limit: 500_000 })

  logger.info(field('action', 'sync-members'), field('members', members.size))
})

client.on('message', async message => {
  if (message.author.bot) return
  if (message.guild === null) return
  if (message.member === null) return
  if (message.guild.id !== GUILD_ID) return
  if (manager.canInitiate(message.member) === false) return

  const prefix = 'c!startvote '
  if (!message.content.toLowerCase().startsWith(prefix)) return

  const content = message.content.slice(prefix.length)
  const targetID = content.replace(/<@!?(\d+)>/, '$1')

  const target = message.guild.member(targetID)
  if (target === null) {
    await message.lineReply('Could not resolve a user with that ID!')
    return
  }

  if (target.id === message.author.id) {
    await message.lineReply('You cannot start a vote against yourself!')
    return
  }

  const inProgress = manager.voteInProgress(target)
  if (inProgress !== undefined) {
    await message.lineReply(
      `A vote against that user is already in progress!\n${inProgress.message.url}`
    )

    return
  }

  const confirmButton = new MessageButton()
    .setLabel('Confirm')
    .setID(interactionID('init', 'confirm', message.author.id, target.id))
    .setStyle('green')

  const cancelButton = new MessageButton()
    .setLabel('Cancel')
    .setID(interactionID('init', 'cancel', message.author.id))
    .setStyle('red')

  await message.channel.send(
    `Are you sure you want to start a vote against \`${target.user.tag}\`?`,
    {
      buttons: [confirmButton, cancelButton],
    }
  )
})

client.on('clickButton', async button => {
  const interaction = parseInteractionID(button.id)
  const { key, components } = interaction

  await button.clicker.fetch()
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

const interval = setInterval(() => {
  // Wait for client to be ready
  if (client.readyAt === null) return

  const expired = manager.getExpired()
  if (expired.length === 0) return

  logger.info(
    field('action', 'sweep-expired'),
    field('expired-count', expired.length)
  )

  for (const vote of expired) {
    // TODO: Edit vote message
    vote.cancel(null)
  }
}, 1000 * 60)

exitHook(async (exit, error) => {
  clearInterval(interval)
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
