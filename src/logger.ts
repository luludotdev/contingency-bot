import {
  createConsoleSink,
  createFileSink,
  createLogger,
} from '@luludev/jogger'
import type { Data, Primitive } from '@luludev/jogger'
import { ChannelType, User } from 'discord.js'
import type {
  ForumChannel,
  GuildMember,
  Role,
  TextBasedChannel,
  VoiceBasedChannel,
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

export const action = (action: string): Data => ({ action })
export const message = (message: string): Data => ({ message })

export const context = (context: string): Data => ({ context })
export const errorField = <T extends Error>(error: T): Data => {
  const fields: Primitive = { type: error.name, message: error.message }
  const all: Primitive = error.stack
    ? { ...fields, stack: error.stack }
    : fields

  return { error: all }
}

export const userField: (user: GuildMember | User) => Primitive = userLike => {
  const user = userLike instanceof User ? userLike : userLike.user

  if (user.discriminator !== '0000') {
    return { id: user.id, username: user.tag }
  }

  return { id: user.id, username: user.username }
}

export const channelField = (
  channel: ForumChannel | TextBasedChannel | VoiceBasedChannel,
): Primitive => {
  const channelType = ChannelType[channel.type] ?? 'unknown'
  const data: Primitive = {
    id: channel.id,
    type: channelType,
  }

  if (channel.isDMBased()) {
    return { ...data, recipient: userField(channel.recipient!) }
  }

  if (channel.isVoiceBased()) {
    return { ...data, name: channel.name }
  }

  if (channel.isThread()) {
    return {
      ...data,
      name: `#${channel.name}`,
      parent: channelField(channel.parent!),
    }
  }

  return { ...data, name: `#${channel.name}` }
}

export const roleField = (role: Role): Primitive => ({
  id: role.id,
  name: role.name,
})

export const createTrace = (ctx: Data, fn: string) => {
  return (message: string) => logger.trace({ ...ctx, fn, trace: message })
}

export const flush = async () => fileSink.flush()
