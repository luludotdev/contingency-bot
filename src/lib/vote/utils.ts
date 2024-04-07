import type { Guild, GuildMember, RoleManager } from 'discord.js'
import { env, roleMap } from '~/env.js'

export const voteWeight: (member: GuildMember) => number = member => {
  const ROLE_WEIGHTS = roleMap(env.ROLE_WEIGHTS)
  const roleTest = member.roles.cache
    .map(role => ROLE_WEIGHTS.get(role.id))
    .filter((weight): weight is number => typeof weight !== 'undefined')

  if (roleTest.length === 0) return 0
  return Math.max(...roleTest)
}

type MemberWeight = [member: GuildMember, weight: number]
export const sortMembersByWeight: (
  a: MemberWeight,
  b: MemberWeight,
) => number = ([member_a, weight_a], [member_b, weight_b]) =>
  weight_a > weight_b
    ? -1
    : weight_a < weight_b
      ? 1
      : member_a.user.username.localeCompare(member_b.user.username)

// export const sweepCache: (client: Client) => Promise<number> = async client => {
//   const guild = await client.guilds.fetch(env.GUILD_ID)
//   const swept = guild.members.cache.sweep(
//     member => member.roles.cache.size === 1,
//   )

//   logger.debug({
//     ...action('sweep-members'),
//     swept,
//   })

//   return swept
// }

// export const syncMembers: (
//   client: Client,
//   limit?: number,
// ) => Promise<number> = async (client, limit = 500_000) => {
//   const guild = await client.guilds.fetch(env.GUILD_ID)
//   const members = await guild.members.fetch({ limit, time: 240e3 })

//   logger.info({
//     ...action('sync-members'),
//     members: members.size,
//   })

//   return members.size
// }

export async function* listMembers(
  guild: Guild,
  {
    limit = 1_000,
    cache = false,
    filter,
  }: {
    limit?: number
    cache?: boolean
    filter?: (member: GuildMember) => boolean
  } = {},
) {
  let after = '0'
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const members = await guild.members.list({ limit, after, cache })
    const last = members.lastKey()
    if (!last) break

    for (const member of members.values()) {
      if (filter) {
        const valid = filter(member)
        if (valid) yield member
      } else {
        yield member
      }
    }

    after = last
  }
}

export const generateMentions = async (
  roles: RoleManager,
  target: GuildMember,
): Promise<string[]> => {
  const ROLE_WEIGHTS = roleMap(env.ROLE_WEIGHTS)
  const ROLE_IDS = [...ROLE_WEIGHTS.keys()]
  for (const id of ROLE_IDS) {
    // eslint-disable-next-line no-await-in-loop
    await roles.fetch(id, { cache: true, force: true })
  }

  const iter = listMembers(roles.guild, {
    filter: member => {
      return member.roles.cache.hasAny(...ROLE_IDS)
    },
  })

  const members: GuildMember[] = []
  for await (const member of iter) {
    members.push(member)
  }

  const values: [member: GuildMember, weight: number][] = members
    .filter(member => member.id !== target.id)
    .map(member => [member, voteWeight(member)])

  values.sort(sortMembersByWeight)
  return values.map(([member]) => member.toString())
}
