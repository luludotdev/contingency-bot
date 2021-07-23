import type { Client, GuildMember } from 'discord.js'

export interface Manager {
  startVote(initiator: GuildMember, target: GuildMember): Promise<void>
  voteInProgress(): boolean
  cancelVote(): void

  canVote(member: GuildMember): boolean
  voteWeight(member: GuildMember): number
  castVote(member: GuildMember): void

  isInitiator(member: GuildMember): boolean
  isTarget(member: GuildMember): boolean

  get initiator(): GuildMember | null
  get target(): GuildMember | null
}

interface Vote {
  startedAt: Date
  initiator: GuildMember
  target: GuildMember
}

export const createManager: (client: Client) => Manager = client => {
  let vote: Vote | null = null

  return {
    async startVote(initiator, target) {
      if (vote !== null) {
        throw new Error('a vote is already in progress')
      }

      const newVote: Vote = {
        startedAt: new Date(),
        initiator,
        target,
      }

      vote = newVote
    },

    voteInProgress() {
      return vote !== null
    },

    cancelVote() {
      vote = null
    },

    canVote(member) {
      // TODO
      throw new Error('Not Implemented')
    },

    voteWeight(member) {
      const hasRole = this.canVote(member)
      if (hasRole === false) return 0

      // TODO
      throw new Error('Not Implemented')
    },

    castVote(member) {
      // TODO
      throw new Error('Not Implemented')
    },

    isInitiator(member) {
      if (vote === null) throw new Error('no vote in progress')
      return member.id === vote.initiator.id
    },

    isTarget(member) {
      if (vote === null) throw new Error('no vote in progress')
      return member.id === vote.target.id
    },

    get initiator() {
      if (vote === null) return null
      return vote.initiator
    },

    get target() {
      if (vote === null) return null
      return vote.target
    },
  }
}
