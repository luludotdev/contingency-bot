import { MessageEmbed } from 'discord.js'
import type { GuildMember } from 'discord.js'

interface EmbedOptions {
  initiator: GuildMember
  target: GuildMember

  descriptionOverride?: string
}

export const generateEmbed: (options: EmbedOptions) => MessageEmbed = ({
  initiator,
  target,
  descriptionOverride,
}) => {
  const descStart = `${initiator} has started a vote to strip roles from ${target}.`
  const description = descriptionOverride
    ? `~~${descStart}~~\n${descriptionOverride}`
    : descStart

  const embed = new MessageEmbed()
    .setTitle('Emergency Vote')
    .setColor(0xed_42_45)
    .setDescription(description)

  return embed
}
