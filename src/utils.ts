import { field } from '@lolpants/jogger'
import type { APIMessage } from 'discord-api-types'
import { Client, Message } from 'discord.js'
import type { GuildMember, RoleManager, TextBasedChannels } from 'discord.js'
import { GUILD_ID, ROLE_WEIGHTS } from '~env/index.js'
import { logger } from '~logger.js'

export const sleepMS: (ms: number) => Promise<void> = async ms =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, ms)
  })

export function resolveMessage(
  channel: TextBasedChannels,
  message: Message | APIMessage | string,
  fetch: true
): Promise<Message>
export function resolveMessage(
  channel: TextBasedChannels,
  message: Message | APIMessage | string,
  fetch?: false
): Promise<Message | undefined>
export async function resolveMessage(
  channel: TextBasedChannels,
  message: Message | APIMessage | string,
  fetch = false
): Promise<Message | undefined> {
  if (message instanceof Message) return message

  const messageID = typeof message === 'string' ? message : message.id
  if (!fetch) channel.messages.cache.get(messageID)

  return channel.messages.fetch(messageID)
}

export const voteWeight: (member: GuildMember) => number = member => {
  const roleTest = member.roles.cache
    .map(role => ROLE_WEIGHTS.get(role.id))
    .filter((weight): weight is number => typeof weight !== 'undefined')

  if (roleTest.length === 0) return 0
  return Math.max(...roleTest)
}

type MemberWeight = [member: GuildMember, weight: number]
export const sortMembersByWeight: (
  a: MemberWeight,
  b: MemberWeight
) => number = ([member_a, weight_a], [member_b, weight_b]) =>
  weight_a > weight_b
    ? -1
    : weight_a < weight_b
    ? 1
    : member_a.user.username.localeCompare(member_b.user.username)

export const sweepCache: (client: Client) => Promise<number> = async client => {
  const guild = await client.guilds.fetch(GUILD_ID)
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
  const guild = await client.guilds.fetch(GUILD_ID)
  const members = await guild.members.fetch({ limit })

  logger.info(field('action', 'sync-members'), field('members', members.size))
  return members.size
}

export const generateMentions: (
  roles: RoleManager,
  target: GuildMember,
  sync?: boolean
) => Promise<string[]> = async (roles, target, sync = true) => {
  try {
    if (sync) {
      await syncMembers(roles.client)
      await sweepCache(roles.client)
    }
  } catch {
    // Warn but continue
    logger.warn(
      field('action', 'mentions'),
      field('message', 'Failed to sync and sweep members!')
    )
  }

  const members: GuildMember[] = []
  for (const roleID of ROLE_WEIGHTS.keys()) {
    const role = roles.resolve(roleID)
    if (role === null) {
      throw new Error(`failed to resolve role: \`${roleID}\``)
    }

    for (const member of role.members.values()) {
      if (!members.includes(member)) {
        members.push(member)
      }
    }
  }

  const values: Array<[member: GuildMember, weight: number]> = members
    .filter(member => member.id !== target.id)
    .map(member => [member, voteWeight(member)])

  values.sort(sortMembersByWeight)
  return values.map(([member]) => member.toString())
}
