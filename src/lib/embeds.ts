import { type ColorResolvable, MessageEmbed } from 'discord.js'
import { Colours, DRY_RUN_PREFIX } from '~/lib/constants.js'

interface EmbedOptions {
  description: string
  colour?: ColorResolvable
  progress: string
  votes: string
}

export const generateEmbed: (options: EmbedOptions) => MessageEmbed = ({
  description,
  colour,
  progress,
  votes,
}) => {
  const dryRunText = DRY_RUN_PREFIX()
  const embed = new MessageEmbed()
    .setTitle(`${dryRunText}Emergency Vote`)
    .setColor(colour ?? Colours.RED)
    .setDescription(description)
    .addField('Progress', progress)
    .addField('Votes', votes)

  return embed
}
