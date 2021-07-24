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

  const buttons = generateVoteButtons({ disabled: true })
  await button.message.edit({ embed, buttons })
}

type Buttons = [
  approve: MessageButton,
  revoke: MessageButton,
  cancel: MessageButton
]

interface VoteButtonOptions {
  disabled?: boolean
  approveData?: string[]
  revokeData?: string[]
  cancelData?: string[]
}

export const generateVoteButtons: (options: VoteButtonOptions) => Buttons =
  options => {
    const disabled = options.disabled ?? false
    const context = disabled ? 'dummy' : 'vote'

    const approveData = options.approveData ?? []
    const revokeData = options.revokeData ?? []
    const cancelData = options.cancelData ?? []

    const approve = new MessageButton()
      .setLabel('Approve')
      .setID(interactionID(context, 'approve', ...approveData))
      .setStyle('blurple')
      .setDisabled(disabled)

    const revoke = new MessageButton()
      .setLabel('Revoke Approval')
      .setID(interactionID(context, 'revoke', ...revokeData))
      .setStyle('gray')
      .setDisabled(disabled)

    const cancel = new MessageButton()
      .setLabel('Cancel')
      .setID(interactionID(context, 'cancel', ...cancelData))
      .setStyle('red')
      .setDisabled(disabled)

    return [approve, revoke, cancel]
  }
