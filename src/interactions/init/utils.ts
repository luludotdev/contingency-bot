import { MessageButton } from 'discord-buttons'
import type { MessageComponent } from 'discord-buttons'
import { MessageEmbed } from 'discord.js'
import type { ColorResolvable } from 'discord.js'
import { Colours, Reply } from '~constants.js'
import { interactionID } from '~interactions/index.js'
import { sleepMS } from '~utils.js'

export const checkUserID = async (button: MessageComponent, userID: string) => {
  if (button.clicker.id !== userID) {
    await button.reply.send(
      Reply.ERR_NOT_INITIATOR,
      // @ts-expect-error
      true
    )

    return false
  }

  return true
}

export const cancelConfirmation = async (
  button: MessageComponent,
  editMessage: string,
  delay = 5000
) => {
  await button.reply.defer(true)

  const buttons = generateInitButtons({ disabled: true })
  await button.message.edit(editMessage, { buttons })

  await sleepMS(delay)
  if (button.message.deletable) await button.message.delete()
}

interface EmbedOptions {
  description: string
  colour?: ColorResolvable
  progress: string
  votes: string
}

type Buttons = [confirm: MessageButton, cancel: MessageButton]
interface InitButtonOptions {
  disabled?: boolean
  confirmData?: string[]
  cancelData?: string[]
}

export const generateInitButtons: (options: InitButtonOptions) => Buttons =
  options => {
    const disabled = options.disabled ?? false
    const context = disabled ? 'dummy' : 'init'

    const confirmData = options.confirmData ?? []
    const cancelData = options.cancelData ?? []

    const confirm = new MessageButton()
      .setLabel('Confirm')
      .setID(interactionID(context, 'confirm', ...confirmData))
      .setStyle('green')
      .setDisabled(disabled)

    const cancel = new MessageButton()
      .setLabel('Cancel')
      .setID(interactionID(context, 'cancel', ...cancelData))
      .setStyle('red')
      .setDisabled(disabled)

    return [confirm, cancel]
  }

export const generateEmbed: (options: EmbedOptions) => MessageEmbed = ({
  description,
  colour,
  progress,
  votes,
}) => {
  const embed = new MessageEmbed()
    .setTitle('Emergency Vote')
    .setColor(colour ?? Colours.RED)
    .setDescription(description)
    .addField('Progress', progress)
    .addField('Votes', votes)

  return embed
}
