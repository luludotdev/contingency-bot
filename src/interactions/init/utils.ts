// import { MessageButton } from 'discord-buttons'
// import type { MessageComponent } from 'discord-buttons'
import { MessageEmbed, MessageButton, MessageActionRow } from 'discord.js'
import type { ColorResolvable } from 'discord.js'
import { Colours, DRY_RUN_PREFIX, Reply } from '~constants.js'
import { interactionID } from '~interactions/index.js'
import { sleepMS } from '~utils.js'

// export const checkUserID = async (button: MessageComponent, userID: string) => {
//   if (button.clicker.id !== userID) {
//     await button.reply.send(
//       Reply.ERR_NOT_INITIATOR,
//       // @ts-expect-error
//       true
//     )

//     return false
//   }

//   return true
// }

// export const cancelConfirmation = async (
//   button: MessageComponent,
//   editMessage: string,
//   delay = 5000
// ) => {
//   await button.reply.defer(true)

//   const buttons = generateInitButtons({ disabled: true })
//   await button.message.edit(editMessage, { buttons })

//   await sleepMS(delay)
//   if (button.message.deletable) await button.message.delete()
// }

interface InitButtonOptions {
  disabled?: boolean
  confirmData?: string[]
  cancelData?: string[]
}

export const generateInitButtons: (options: InitButtonOptions) => MessageActionRow =
  options => {
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
