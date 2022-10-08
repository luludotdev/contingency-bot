import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import { interactionID } from '~/lib/interactions.js'

interface InitButtonOptions {
  disabled?: boolean
  confirmData?: string[]
  cancelData?: string[]
}

export const generateInitButtons: (
  options: InitButtonOptions,
) => ActionRowBuilder<ButtonBuilder> = options => {
  const disabled = options.disabled ?? false
  const context = disabled ? 'dummy' : 'init'

  const confirmData = options.confirmData ?? []
  const cancelData = options.cancelData ?? []

  const confirm = new ButtonBuilder()
    .setLabel('Confirm')
    .setCustomId(interactionID(context, 'confirm', ...confirmData))
    .setStyle(ButtonStyle.Success)
    .setDisabled(disabled)

  const cancel = new ButtonBuilder()
    .setLabel('Cancel')
    .setCustomId(interactionID(context, 'cancel', ...cancelData))
    .setStyle(ButtonStyle.Danger)
    .setDisabled(disabled)

  return new ActionRowBuilder<ButtonBuilder>().addComponents(confirm, cancel)
}

interface VoteButtonOptions {
  disabled?: boolean
  approveData?: string[]
  revokeData?: string[]
  cancelData?: string[]
}

export const generateVoteButtons: (
  options: VoteButtonOptions,
) => ActionRowBuilder<ButtonBuilder> = options => {
  const disabled = options.disabled ?? false
  const context = disabled ? 'dummy' : 'vote'

  const approveData = options.approveData ?? []
  const revokeData = options.revokeData ?? []
  const cancelData = options.cancelData ?? []

  const approve = new ButtonBuilder()
    .setLabel('Approve')
    .setCustomId(interactionID(context, 'approve', ...approveData))
    .setStyle(ButtonStyle.Primary)
    .setDisabled(disabled)

  const revoke = new ButtonBuilder()
    .setLabel('Revoke Approval')
    .setCustomId(interactionID(context, 'revoke', ...revokeData))
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled)

  const cancel = new ButtonBuilder()
    .setLabel('Cancel')
    .setCustomId(interactionID(context, 'cancel', ...cancelData))
    .setStyle(ButtonStyle.Danger)
    .setDisabled(disabled)

  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    approve,
    revoke,
    cancel,
  )
}
