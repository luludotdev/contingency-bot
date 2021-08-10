import type { APIMessage } from 'discord-api-types'
import { Message } from 'discord.js'
import type { GuildMember, RoleManager, TextBasedChannels } from 'discord.js'
import { ROLE_WEIGHTS } from '~env/index.js'

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
export const sortMembersByWeight: (a: MemberWeight, b: MemberWeight) => number =
  ([member_a, weight_a], [member_b, weight_b]) =>
    weight_a > weight_b
      ? -1
      : weight_a < weight_b
      ? 1
      : member_a.user.username.localeCompare(member_b.user.username)

export const generateMentions: (
  roles: RoleManager,
  target: GuildMember
) => string[] = (roles, target) => {
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
