import 'source-map-support/register.js'

import { field } from '@lolpants/jogger'
import { Client } from 'discord.js'
import { TOKEN } from './env/index.js'
import { exitHook } from './exit.js'
import { errorField, flush, logger } from './logger.js'

const client = new Client()
client.on('ready', () => {
  logger.info(
    field('action', 'ready'),
    field('user', client.user?.tag ?? 'Unknown')
  )
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
