import {
  type CommandInteraction,
  type GuildMember,
  ApplicationCommandOptionType as OptionType,
  User,
} from 'discord.js'
import { Discord, Slash, SlashOption } from 'discordx'
import { generateInitButtons } from '~/lib/buttons.js'
import { DRY_RUN_RICH, Reply } from '~/lib/constants.js'
import { manager } from '~/lib/manager.js'

@Discord()
export abstract class StartVote {
  @Slash('start-vote')
  public async run(
    @SlashOption('target', { type: OptionType.User })
    target: GuildMember | User,
    ctx: CommandInteraction
  ) {
    if (ctx.guild === null) {
      await ctx.reply({
        content: Reply.ERR_IS_DM,
        ephemeral: true,
      })

      return
    }

    if (target instanceof User) {
      await ctx.reply({
        content: Reply.ERR_NOT_IN_GUILD,
        ephemeral: true,
      })

      return
    }

    if (target.id === ctx.client.user?.id) {
      await ctx.reply({
        content: Reply.ERR_IS_BOT,
        ephemeral: true,
      })

      return
    }

    if (target.id === ctx.user.id) {
      await ctx.reply({
        content: Reply.ERR_IS_SELF,
        ephemeral: true,
      })

      return
    }

    const botRolePosition = ctx.guild.members.me?.roles.highest.position ?? -1
    const targetRolePosition = target.roles.highest.position
    if (botRolePosition <= targetRolePosition) {
      await ctx.reply({
        content: Reply.ERR_TARGET_HIGHER,
        ephemeral: true,
      })

      return
    }

    const inProgress = manager.voteInProgress(target)
    if (inProgress !== undefined) {
      await ctx.reply({
        content: `${Reply.ERR_IN_PROGRESS}\n${inProgress.message.url}`,
        ephemeral: true,
      })

      return
    }

    const buttons = generateInitButtons({
      confirmData: [ctx.user.id, target.id],
      cancelData: [ctx.user.id],
    })

    const dryRunText = DRY_RUN_RICH()
    const content = `${dryRunText}Are you sure you want to start a vote against \`${target.user.tag}\`?`

    await ctx.reply({
      content,
      components: [buttons],
    })
  }
}
