import { MessageEmbed, MessageActionRow, MessageButton } from 'discord.js'
import type { ButtonInteraction } from 'discord.js'
import { interactionID } from '~interactions/index.js'

export const cancelVote = async (
  button: ButtonInteraction,
  embed: MessageEmbed
) => {
  const buttons = generateVoteButtons({ disabled: true })
  await button.update({ embeds: [embed], components: [buttons] })
}

interface VoteButtonOptions {
  disabled?: boolean
  approveData?: string[]
  revokeData?: string[]
  cancelData?: string[]
}

export const generateVoteButtons: (options: VoteButtonOptions) => MessageActionRow =
  options => {
    const disabled = options.disabled ?? false
    const context = disabled ? 'dummy' : 'vote'

    const approveData = options.approveData ?? []
    const revokeData = options.revokeData ?? []
    const cancelData = options.cancelData ?? []

    const approve = new MessageButton()
      .setLabel('Approve')
      .setCustomId(interactionID(context, 'approve', ...approveData))
      .setStyle('PRIMARY')
      .setDisabled(disabled)

    const revoke = new MessageButton()
      .setLabel('Revoke Approval')
      .setCustomId(interactionID(context, 'revoke', ...revokeData))
      .setStyle('SECONDARY')
      .setDisabled(disabled)

    const cancel = new MessageButton()
      .setLabel('Cancel')
      .setCustomId(interactionID(context, 'cancel', ...cancelData))
      .setStyle('DANGER')
      .setDisabled(disabled)

      const row = new MessageActionRow().addComponents(approve, revoke, cancel)
      return row
  }
