import { EmbedBuilder } from 'discord.js'
import type { ColorResolvable, GuildMember } from 'discord.js'
import { Colours, DRY_RUN_PREFIX } from '~/lib/constants.js'

export const generateEmbed = ({
  initiator,
  target,
  colour,
  progress,
  votes,
}: {
  initiator: GuildMember
  target: GuildMember
  colour?: ColorResolvable
  progress: string
  votes: string
}): EmbedBuilder => {
  const description = `${initiator} has started a vote to strip roles from ${target}`

  const dryRunText = DRY_RUN_PREFIX()
  return new EmbedBuilder()
    .setTitle(`${dryRunText}Emergency Vote`)
    .setColor(colour ?? Colours.RED)
    .setDescription(description)
    .addFields({ name: 'Progress', value: progress })
    .addFields({ name: 'Votes', value: votes })
}
