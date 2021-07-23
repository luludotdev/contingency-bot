import 'source-map-support/register.js'

import { field } from '@lolpants/jogger'
import buttons from 'discord-buttons'
import { Client } from 'discord.js'
import { GUILD_ID, TOKEN } from './env/index.js'
import { exitHook } from './exit.js'
import { errorField, flush, logger } from './logger.js'

const client = new Client()
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

  console.log({ target })
  // TODO: Start Vote
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
