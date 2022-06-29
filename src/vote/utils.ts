import { field } from '@lolpants/jogger'
import { type Client } from 'discordx'
import { env } from '~/env.js'
import { logger } from '~/logger.js'

export const sweepCache: (client: Client) => Promise<number> = async client => {
  const guild = await client.guilds.fetch(env.GUILD_ID)
  const swept = guild.members.cache.sweep(
    member => member.roles.cache.size === 1
  )

  logger.debug(field('action', 'sweep-members'), field('swept', swept))
  return swept
}

export const syncMembers: (
  client: Client,
  limit?: number
) => Promise<number> = async (client, limit = 500_000) => {
  const guild = await client.guilds.fetch(env.GUILD_ID)
  const members = await guild.members.fetch({ limit })

  logger.info(field('action', 'sync-members'), field('members', members.size))
  return members.size
}
