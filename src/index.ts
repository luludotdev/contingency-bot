import 'source-map-support/register.js'
import 'reflect-metadata'

import { exitHook } from '@lolpants/exit'
import { field } from '@lolpants/jogger'
import { errorField, flush, logger } from '~/logger.js'

const boot = async () => {
  const { run } = await import('./bot.js')
  await run()
}

exitHook(async (exit, error) => {
  if (error) {
    logger.error(errorField(error))
  } else {
    logger.info(field('action', 'shutdown'))
  }

  await flush()
  exit()
})

void boot()
