import { type ColorResolvable, EmbedBuilder } from 'discord.js'
import { Colours, DRY_RUN_PREFIX } from '~/lib/constants.js'

interface EmbedOptions {
  description: string
  colour?: ColorResolvable
  progress: string
  votes: string
}

export const generateEmbed: (options: EmbedOptions) => EmbedBuilder = ({
  description,
  colour,
  progress,
  votes,
}) => {
  const dryRunText = DRY_RUN_PREFIX()
  const embed = new EmbedBuilder()
    .setTitle(`${dryRunText}Emergency Vote`)
    .setColor(colour ?? Colours.RED)
    .setDescription(description)
    .addFields({ name: 'Progress', value: progress })
    .addFields({ name: 'Votes', value: votes })

  return embed
}
