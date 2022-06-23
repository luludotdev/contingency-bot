import {
  createConsoleSink,
  createField,
  createFileSink,
  createLogger,
  field,
} from '@lolpants/jogger'
import type { Field } from '@lolpants/jogger'
import { env, IS_DEV } from '~/env.js'

const consoleSink = createConsoleSink(IS_DEV)
const fileSink = createFileSink({
  name: 'bot',
  directory: 'logs',
  debug: env.DEBUG_LOGS ?? IS_DEV,
  rollEveryDay: true,
})

export const logger = createLogger({
  name: 'bot',
  sink: [consoleSink, fileSink],
})

export const ctxField = createField('context')
export const errorField: <T extends Error>(
  error: T
) => Readonly<Field> = error => {
  const array: Array<Readonly<Field>> = [
    field('type', error.name),
    field('message', error.message),
  ]

  if (error.stack) array.push(field('stack', error.stack))
  return field('error', array[0], ...array.slice(1))
}

export const flush = async () => fileSink.flush()
