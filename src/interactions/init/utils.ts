import { MessageButton } from 'discord-buttons'
import type { MessageComponent } from 'discord-buttons'
import { sleepMS } from '../../utils.js'
import { interactionID } from '../index.js'

export const checkUserID = async (button: MessageComponent, userID: string) => {
  if (button.clicker.id !== userID) {
    await button.reply.send(
      'Only the user who started the vote can confirm or cancel.',
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

  const confirmButton = new MessageButton()
    .setLabel('Confirm')
    .setID(interactionID('dummy', 'confirm'))
    .setStyle('green')
    .setDisabled(true)

  const cancelButton = new MessageButton()
    .setLabel('Cancel')
    .setID(interactionID('dummy', 'cancel'))
    .setStyle('red')
    .setDisabled(true)

  await button.message.edit(editMessage, {
    buttons: [confirmButton, cancelButton],
  })

  await sleepMS(delay)
  if (button.message.deletable) await button.message.delete()
}
