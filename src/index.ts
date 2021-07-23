import 'source-map-support/register.js'

import { field } from '@lolpants/jogger'
import buttons, { MessageButton } from 'discord-buttons'
import { Client } from 'discord.js'
import { GUILD_ID, TOKEN } from './env/index.js'
import { exitHook } from './exit.js'
import { interactionID, parseInteractionID } from './interactions/index.js'
import type { HandlerParameters } from './interactions/index.js'
import { init__cancel } from './interactions/init/cancel.js'
import { init__confirm } from './interactions/init/confirm.js'
import { errorField, flush, logger } from './logger.js'
import { createManager } from './manager.js'

const client = new Client()
const manager = createManager(client)
buttons(client)

client.on('ready', () => {
  logger.info(
    field('action', 'ready'),
    field('user', client.user?.tag ?? 'Unknown')
  )
})

client.on('message', async message => {
  if (message.author.bot) return
  if (message.guild === null) return
  if (message.member === null) return
  if (message.guild.id !== GUILD_ID) return

  // TODO: Role Checks

  const prefix = 'c!startvote '
  if (!message.content.toLowerCase().startsWith(prefix)) return

  const content = message.content.slice(prefix.length)
  const targetID = content.replace(/<@!?(\d+)>/, '$1')

  const target = message.guild.member(targetID)
  if (target === null) {
    await message.reply('Could not resolve a user with that ID!')
    return
  }

  if (target.id === message.author.id) {
    await message.reply('You cannot start a vote against yourself!')
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

exitHook(async (exit, error) => {
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
