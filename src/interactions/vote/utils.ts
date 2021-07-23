import { MessageButton } from 'discord-buttons'
import type { MessageComponent } from 'discord-buttons'
import { MessageEmbed } from 'discord.js'
import { interactionID } from '~interactions/index.js'

export const cancelVote = async (
  button: MessageComponent,
  embed: MessageEmbed,
  defer = true
) => {
  if (defer) await button.reply.defer(true)

  const approveButton = new MessageButton()
    .setLabel('Approve')
    .setID(interactionID('dummy', 'approve'))
    .setStyle('blurple')
    .setDisabled(true)

  const revokeButton = new MessageButton()
    .setLabel('Revoke Approval')
    .setID(interactionID('dummy', 'revoke'))
    .setStyle('gray')
    .setDisabled(true)

  const cancelButton = new MessageButton()
    .setLabel('Cancel')
    .setID(interactionID('dummy', 'cancel'))
    .setStyle('red')
    .setDisabled(true)

  await button.message.edit({
    embed,
    buttons: [approveButton, revokeButton, cancelButton],
  })
}
