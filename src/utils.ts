import type { GuildMember } from 'discord.js'

export const sleepMS: (ms: number) => Promise<void> = async ms =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, ms)
  })

type MemberWeight = [member: GuildMember, weight: number]
export const sortMembersByWeight: (a: MemberWeight, b: MemberWeight) => number =
  ([member_a, weight_a], [member_b, weight_b]) =>
    weight_a > weight_b
      ? -1
      : weight_a < weight_b
      ? 1
      : member_a.user.username.localeCompare(member_b.user.username)
