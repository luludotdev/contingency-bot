import {
  createConsoleSink,
  createField,
  createFileSink,
  createLogger,
  field,
} from '@lolpants/jogger'
import type { Field } from '@lolpants/jogger'
import { User } from 'discord.js'
import type { GuildMember, TextBasedChannel } from 'discord.js'
import { env, IS_DEV } from '~/env.js'

const consoleSink = createConsoleSink({
  debug: env.DEBUG_LOGS ?? IS_DEV,
  trace: env.TRACE_LOGS,
})

const fileSink = createFileSink({
  name: 'bot',
  directory: 'logs',
  debug: env.DEBUG_LOGS ?? IS_DEV,
  trace: env.TRACE_LOGS,
  rollEveryDay: true,
})

export const logger = createLogger({
  name: 'bot',
  sink: [consoleSink, fileSink],
})

export const ctxField = createField('context')
export const errorField: <T extends Error>(error: T) => Field = error => {
  const fields: [Field, ...Field[]] = [
    field('type', error.name),
    field('message', error.message),
  ]

  if (error.stack) fields.push(field('stack', error.stack))
  return field('error', ...fields)
}

export const userField: (name: string, user: GuildMember | User) => Field = (
  name,
  userLike,
) => {
  const user = userLike instanceof User ? userLike : userLike.user
  return field(name, field('id', user.id), field('tag', user.tag))
}

export const channelField: (
  name: string,
  channel: TextBasedChannel,
) => Field = (name, channel) => {
  if (channel.isDMBased()) {
    return field(
      name,
      field('id', channel.id),
      field('type', channel.type),
      userField('recipient', channel.recipient!),
    )
  }

  return field(
    name,
    field('id', channel.id),
    field('type', channel.type),
    field('name', `#${channel.name}`),
  )
}

const traceFn = createField('fn')
const trace = createField('trace')
export const createTrace = (ctx: Field, fn: string) => {
  const fnField = traceFn(fn)
  return (message: string) => logger.trace(ctx, fnField, trace(message))
}

export const flush = async () => fileSink.flush()
