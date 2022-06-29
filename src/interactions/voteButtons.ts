import { type ButtonInteraction } from 'discord.js'
import { ButtonComponent, Discord } from 'discordx'
import { interactionRX } from '~/lib/interactions.js'

@Discord()
export abstract class VoteButtons {
  @ButtonComponent(interactionRX('vote', 'approve'))
  public async runApprove(button: ButtonInteraction) {
    // TODO
  }

  @ButtonComponent(interactionRX('vote', 'revoke'))
  public async runRevoke(button: ButtonInteraction) {
    // TODO
  }

  @ButtonComponent(interactionRX('vote', 'cancel'))
  public async runCancel(button: ButtonInteraction) {
    // TODO
  }
}
