import { MessageEmbed } from 'discord.js'
import type { Command } from '~commands/index.js'
import { PREFIX, Reply } from '~constants.js'

export const help: Command = async ({ message }) => {
  const embed = new MessageEmbed()
    .setTitle('Contingency Bot - Help')
    .addField(
      `\`${PREFIX}startvote <target>\``,
      'Starts a vote against `<target>`\nCan be either a mention or a user ID'
    )
    .addField(`\`${PREFIX}help\``, 'Sends this message in DMs')

  try {
    await message.author.send({ embeds: [embed] })
    await message.reply({
      content: Reply.HELP_SENT,
      allowedMentions: { repliedUser: false },
    })
  } catch {
    await message.reply(Reply.ERR_DMS_CLOSED)
  }
}
