import type { Client, Guild, Message } from 'discord.js'
import type { Manager } from '~manager.js'

export type Command = (parameters: CommandParameters) => Promise<void>
export interface CommandParameters {
  message: Message
  guild: Guild
  content: string

  client: Client
  manager: Manager
}
