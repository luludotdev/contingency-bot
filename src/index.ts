import { field } from '@lolpants/jogger'
import sourceMapSupport from 'source-map-support'
import { exitHook } from './exit.js'
import { errorField, flush, logger } from './logger.js'

// Enable Source Maps
sourceMapSupport.install()

exitHook(async (exit, error) => {
  if (error) {
    logger.error(errorField(error))
  } else {
    logger.info(field('action', 'shutdown'))
  }

  await flush()
  exit()
})
