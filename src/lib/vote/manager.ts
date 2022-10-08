import type { GuildMember, Message } from 'discord.js'
import ms from 'ms'
import { generateMentions, sortMembersByWeight, voteWeight } from './utils.js'
import { env } from '~/env.js'

export interface Manager {
  startVote(
    message: Message,
    initiator: GuildMember,
    target: GuildMember,
  ): Promise<Vote>

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

  approve(member: GuildMember): void
  revoke(member: GuildMember): void
  hasVoted(member: GuildMember): boolean

  isInitiator(member: GuildMember): boolean
  isTarget(member: GuildMember): boolean
  canVote(member: GuildMember): boolean

  cancel(member: GuildMember | undefined): void
  replaceMessage(newMessage: Message): void

  mentions(sync?: boolean): Promise<string[]>
}

export const createManager: () => Manager = () => {
  const votes = new Map<string, Vote>()

  return {
    async startVote(message, initiator, target) {
      if (!this.canInitiate(initiator)) throw new Error('not allowed')
      if (votes.has(message.id)) {
        throw new Error(`vote already exists for message \`${message.id}\``)
      }

      const vote = await createVote(message, initiator, target, this)
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
      return [...votes.values()].filter(vote => {
        const startedAt = vote.startedAt.getTime()
        const future = startedAt + ms(env.MAX_VOTE_LIFETIME)

        return now > future
      })
    },

    canInitiate(member) {
      const weight = voteWeight(member)
      return weight >= env.VOTING_WEIGHT
    },
  }
}

const createVote: (
  message: Message,
  initiator: GuildMember,
  target: GuildMember,
  manager: Manager,
) => Promise<Vote> = async (_message, _initiator, _target, _manager) => {
  const startedAt = new Date()
  let message = _message

  const initiator = _initiator
  const target = _target
  const manager = _manager

  type VotesMap = Map<GuildMember['id'], [member: GuildMember, weight: number]>
  const votes: VotesMap = new Map()
  votes.set(initiator.id, [initiator, voteWeight(initiator)])

  const vote: Vote = {
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
      return [...votes.values()]
        .map(([_, weight]) => weight)
        .reduce((acc, weight) => acc + weight, 0)
    },

    get isMet() {
      return this.score >= env.TARGET_SCORE
    },

    get voterList() {
      const values = [...votes.values()]
      if (values.length === 0) return '*No votes yet.*'

      values.sort(sortMembersByWeight)
      return values
        .map(([member, weight]) => `• ${member} (${weight})`)
        .join('\n')
    },

    get progress() {
      const percentage = Math.min(this.score / env.TARGET_SCORE, 1)
      const percentString = (percentage * 100).toFixed(0)

      return `${this.score} / ${env.TARGET_SCORE} (${percentString}%)`
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

    async mentions(sync = true) {
      const { guild } = message
      if (guild === null) throw new Error('guild is null')

      return generateMentions(guild.roles, target, sync)
    },
    // #endregion
  }

  return vote
}
