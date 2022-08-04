import {
  createConsoleSink,
  createField,
  createFileSink,
  createLogger,
  field,
} from '@lolpants/jogger'
import type { Field } from '@lolpants/jogger'
import {
  ChannelType,
  type GuildMember,
  type TextBasedChannel,
  User,
} from 'discord.js'
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

export const userField: (
  name: string,
  user: User | GuildMember
) => Readonly<Field> = (name, u) => {
  const user = u instanceof User ? u : u.user
  return field(name, field('id', user.id), field('tag', user.tag))
}

export const channelField: (
  name: string,
  channel: TextBasedChannel
) => Readonly<Field> = (name, channel) => {
  if (channel.type === ChannelType.DM) {
    return field(
      name,
      field('id', channel.id),
      field('type', channel.type),
      userField('recipient', channel.recipient!)
    )
  }

  return field(
    name,
    field('id', channel.id),
    field('type', channel.type),
    field('name', `#${channel.name}`)
  )
}

export const flush = async () => fileSink.flush()
