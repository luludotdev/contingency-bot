import { MessageEmbed } from 'discord.js'

interface EmbedOptions {
  description: string
}

export const generateEmbed: (options: EmbedOptions) => MessageEmbed = ({
  description,
}) => {
  const embed = new MessageEmbed()
    .setTitle('Emergency Vote')
    .setColor(0xed_42_45)
    .setDescription(description)

  return embed
}
