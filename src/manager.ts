import type { GuildMember, Message } from 'discord.js'
import {
  MAX_VOTE_LIFETIME,
  ROLE_WEIGHTS,
  TARGET_SCORE,
  VOTING_WEIGHT,
} from '~env/index.js'

export interface Manager {
  startVote(message: Message, initiator: GuildMember, target: GuildMember): Vote
  cancelVote(messageID: string): boolean
  replaceVote(oldMessageID: string, newMessageID: string): void

  getVote(messageID: string): Vote | undefined
  voteInProgress(target: GuildMember): Vote | undefined
  getExpired(): Vote[]

  canInitiate(member: GuildMember): boolean
}

export interface Vote {
  get message(): Message
  get startedAt(): Date

  get initiator(): GuildMember
  get target(): GuildMember

  get score(): number
  get isMet(): boolean

  get voterList(): string
  get progress(): string

  get mentions(): string[]

  approve(member: GuildMember): void
  revoke(member: GuildMember): void
  hasVoted(member: GuildMember): boolean

  isInitiator(member: GuildMember): boolean
  isTarget(member: GuildMember): boolean
  canVote(member: GuildMember): boolean

  cancel(member: GuildMember | null): void
  replaceMessage(newMessage: Message): void
}

export const createManager: () => Manager = () => {
  const votes: Map<string, Vote> = new Map()

  return {
    startVote(message, initiator, target) {
      if (!this.canInitiate(initiator)) throw new Error('not allowed')
      if (votes.has(message.id)) {
        throw new Error(`vote already exists for message \`${message.id}\``)
      }

      const vote = createVote(message, initiator, target, this)
      votes.set(message.id, vote)

      return vote
    },

    cancelVote(messageID) {
      return votes.delete(messageID)
    },

    replaceVote(oldMessageID, newMessageID) {
      const vote = votes.get(oldMessageID)
      if (vote === undefined) return

      votes.set(newMessageID, vote)
      votes.delete(oldMessageID)
    },

    getVote(messageID) {
      return votes.get(messageID)
    },

    voteInProgress(target) {
      for (const vote of votes.values()) {
        if (vote.isTarget(target)) return vote
      }

      return undefined
    },

    getExpired() {
      const now = Date.now()
      const expired = [...votes.values()].filter(vote => {
        const startedAt = vote.startedAt.getTime()
        const future = startedAt + MAX_VOTE_LIFETIME

        return now > future
      })

      return expired
    },

    canInitiate(member) {
      const weight = voteWeight(member)
      return weight >= VOTING_WEIGHT
    },
  }
}

const createVote: (
  message: Message,
  initiator: GuildMember,
  target: GuildMember,
  manager: Manager
) => Vote = (_message, _initiator, _target, _manager) => {
  const startedAt = new Date()
  let message = _message

  const initiator = _initiator
  const target = _target
  const manager = _manager

  type VotesMap = Map<GuildMember['id'], [member: GuildMember, weight: number]>
  const votes: VotesMap = new Map()
  votes.set(initiator.id, [initiator, voteWeight(initiator)])

  return {
    // #region Getters
    get message() {
      return message
    },

    get startedAt() {
      return startedAt
    },

    get initiator() {
      return initiator
    },

    get target() {
      return target
    },

    get score() {
      const score = [...votes.values()]
        .map(([_, weight]) => weight)
        .reduce((acc, weight) => acc + weight, 0)

      return score
    },

    get isMet() {
      return this.score >= TARGET_SCORE
    },

    get voterList() {
      const values = [...votes.values()]
      if (values.length === 0) return '*No votes yet.*'

      values.sort(([member_a, weight_a], [member_b, weight_b]) =>
        weight_a > weight_b
          ? -1
          : weight_a < weight_b
          ? 1
          : member_a.user.username.localeCompare(member_b.user.username)
      )

      return values
        .map(([member, weight]) => `• ${member} (${weight})`)
        .join('\n')
    },

    get progress() {
      const percentage = ((this.score / TARGET_SCORE) * 100).toFixed(0)
      return `${this.score} / ${TARGET_SCORE} (${percentage}%)`
    },

    get mentions() {
      const guild = message.guild
      if (guild === null) throw new Error('guild is null')

      const members: GuildMember[] = []
      for (const roleID of ROLE_WEIGHTS.keys()) {
        const role = guild.roles.resolve(roleID)
        if (role === null) {
          throw new Error(`failed to resolve role: \`${roleID}\``)
        }

        for (const member of role.members.values()) {
          if (!members.includes(member)) {
            members.push(member)
          }
        }
      }

      const mapped: Array<[member: GuildMember, weight: number]> = members
        .filter(member => member.id !== target.id)
        .map(member => [member, voteWeight(member)])

      const sorted = mapped.sort(([member_a, weight_a], [member_b, weight_b]) =>
        weight_a > weight_b
          ? -1
          : weight_a < weight_b
          ? 1
          : member_a.user.username.localeCompare(member_b.user.username)
      )

      return sorted.map(([member]) => member.toString())
    },
    // #endregion

    // #region Methods
    approve(member) {
      if (!this.canVote(member)) throw new Error('not allowed')

      const weight = voteWeight(member)
      votes.set(member.id, [member, weight])
    },

    revoke(member) {
      if (!this.canVote(member)) throw new Error('not allowed')
      votes.delete(member.id)
    },

    hasVoted(member) {
      return votes.has(member.id)
    },

    isInitiator(member) {
      return member.id === initiator.id
    },

    isTarget(member) {
      return member.id === target.id
    },

    canVote(member) {
      const weight = voteWeight(member)
      return weight > 0
    },

    cancel(member) {
      if (member && !this.isInitiator(member)) throw new Error('not allowed')

      manager.cancelVote(this.message.id)
    },

    replaceMessage(newMessage) {
      const oldID = message.id
      message = newMessage

      manager.replaceVote(oldID, newMessage.id)
    },
    // #endregion
  }
}

const voteWeight: (member: GuildMember) => number = member => {
  const roleTest = member.roles.cache
    .map(role => ROLE_WEIGHTS.get(role.id))
    .filter((weight): weight is number => typeof weight !== 'undefined')

  if (roleTest.length === 0) return 0
  return Math.max(...roleTest)
}
