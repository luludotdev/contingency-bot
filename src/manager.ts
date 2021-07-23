import type { GuildMember } from 'discord.js'
import { ROLE_WEIGHTS, VOTING_WEIGHT } from '~env/index.js'

export interface Manager {
  startVote(initiator: GuildMember, target: GuildMember): Vote
  voteInProgress(): boolean
  cancelVote(): void

  voteWeight(member: GuildMember): number
  canInitiate(member: GuildMember): boolean
  canVote(member: GuildMember): boolean
  castVote(member: GuildMember): Vote

  isInitiator(member: GuildMember): boolean
  isTarget(member: GuildMember): boolean

  get initiator(): GuildMember | null
  get target(): GuildMember | null
}

interface Vote {
  startedAt: Date
  initiator: GuildMember
  target: GuildMember

  votes: Map<GuildMember['id'], [member: GuildMember, weight: number]>
  get score(): number
  get voters(): string
}

export const createManager: () => Manager = () => {
  let vote: Vote | null = null

  return {
    startVote(initiator, target) {
      if (vote !== null) {
        throw new Error('a vote is already in progress')
      }

      const newVote: Vote = {
        startedAt: new Date(),
        initiator,
        target,

        votes: new Map([
          [initiator.id, [initiator, this.voteWeight(initiator)]],
        ]),
        get score() {
          const score = [...this.votes.values()]
            .map(([_, weight]) => weight)
            .reduce((acc, weight) => acc + weight, 0)

          return score
        },
        get voters() {
          return [...this.votes.values()]
            .map(([member, weight]) => `• ${member} (${weight})`)
            .join('\n')
        },
      }

      vote = newVote
      return vote
    },

    voteInProgress() {
      return vote !== null
    },

    cancelVote() {
      vote = null
    },

    voteWeight(member) {
      const roleTest = member.roles.cache
        .map(role => ROLE_WEIGHTS.get(role.id))
        .filter((weight): weight is number => typeof weight !== 'undefined')

      if (roleTest.length === 0) return 0
      return Math.max(...roleTest)
    },

    canInitiate(member) {
      const weight = this.voteWeight(member)
      return weight >= VOTING_WEIGHT
    },

    canVote(member) {
      const weight = this.voteWeight(member)
      return weight > 0
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
