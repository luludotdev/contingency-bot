import { MessageEmbed } from 'discord.js'
import type { Command } from '~commands/index.js'
import { Reply } from '~constants.js'

export const help: Command = async ({ message }) => {
  // TODO: Fill out embed
  const embed = new MessageEmbed().setTitle('Contingency Bot')

  try {
    await message.author.send({ embeds: [embed] })
  } catch {
    await message.reply(Reply.ERR_DMS_CLOSED)
  }
}
