import { MessageActionRow, MessageButton, MessageEmbed } from 'discord.js'
import type { ButtonInteraction, ColorResolvable } from 'discord.js'
import { Colours, DRY_RUN_PREFIX, Reply } from '~constants.js'
import { interactionID } from '~interactions/index.js'
import { sleepMS } from '~utils.js'

export const checkUserID = async (
  button: ButtonInteraction,
  userID: string
) => {
  if (button.user.id !== userID) {
    await button.reply({ content: Reply.ERR_NOT_INITIATOR, ephemeral: true })
    return false
  }

  return true
}

export const cancelConfirmation = async (
  button: ButtonInteraction,
  editMessage: string,
  delay = 5000
) => {
  const buttons = generateInitButtons({ disabled: true })
  await button.update({ content: editMessage, components: [buttons] })

  await sleepMS(delay)

  const message = button.channel?.messages.cache.get(button.message.id)
  if (message?.deletable) await message.delete()
}

interface InitButtonOptions {
  disabled?: boolean
  confirmData?: string[]
  cancelData?: string[]
}

export const generateInitButtons: (
  options: InitButtonOptions
) => MessageActionRow = options => {
  const disabled = options.disabled ?? false
  const context = disabled ? 'dummy' : 'init'

  const confirmData = options.confirmData ?? []
  const cancelData = options.cancelData ?? []

  const confirm = new MessageButton()
    .setLabel('Confirm')
    .setCustomId(interactionID(context, 'confirm', ...confirmData))
    .setStyle('SUCCESS')
    .setDisabled(disabled)

  const cancel = new MessageButton()
    .setLabel('Cancel')
    .setCustomId(interactionID(context, 'cancel', ...cancelData))
    .setStyle('DANGER')
    .setDisabled(disabled)

  const row = new MessageActionRow().addComponents(confirm, cancel)
  return row
}

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
  const embed = new MessageEmbed()
    .setTitle(`${DRY_RUN_PREFIX}Emergency Vote`)
    .setColor(colour ?? Colours.RED)
    .setDescription(description)
    .addField('Progress', progress)
    .addField('Votes', votes)

  return embed
}
