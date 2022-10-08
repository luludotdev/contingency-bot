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
import { createTrace, ctxField } from '~/logger.js'

const context = ctxField('startVote')

@Discord()
export abstract class StartVote {
  @Slash({
    name: 'start-vote',
    description: 'Start an emergency vote to strip roles from a user',
    defaultMemberPermissions: 'ManageGuild',
  })
  public async run(
    @SlashOption({
      name: 'target',
      description: 'Target of the vote',
      type: OptionType.User,
    })
    target: GuildMember | User,
    ctx: CommandInteraction,
  ) {
    const trace = createTrace(context, 'run')
    trace('command invoked')

    if (ctx.guild === null) {
      trace('guild is null')
      await ctx.reply({
        content: Reply.ERR_IS_DM,
        ephemeral: true,
      })

      return
    }

    if (target instanceof User) {
      trace('target is user')
      await ctx.reply({
        content: Reply.ERR_NOT_IN_GUILD,
        ephemeral: true,
      })

      return
    }

    if (target.id === ctx.client.user?.id) {
      trace('target is bot')
      await ctx.reply({
        content: Reply.ERR_IS_BOT,
        ephemeral: true,
      })

      return
    }

    if (target.id === ctx.user.id) {
      trace('target is self')
      await ctx.reply({
        content: Reply.ERR_IS_SELF,
        ephemeral: true,
      })

      return
    }

    const botRolePosition = ctx.guild.members.me?.roles.highest.position ?? -1
    const targetRolePosition = target.roles.highest.position
    if (botRolePosition <= targetRolePosition) {
      trace('target has higher role')
      await ctx.reply({
        content: Reply.ERR_TARGET_HIGHER,
        ephemeral: true,
      })

      return
    }

    const inProgress = manager.voteInProgress(target)
    if (inProgress !== undefined) {
      trace('vote already in progress')
      await ctx.reply({
        content: `${Reply.ERR_IN_PROGRESS}\n${inProgress.message.url}`,
        ephemeral: true,
      })

      return
    }

    trace('generating buttons')
    const buttons = generateInitButtons({
      confirmData: [ctx.user.id, target.id],
      cancelData: [ctx.user.id],
    })

    const dryRunText = DRY_RUN_RICH()
    const content = `${dryRunText}Are you sure you want to start a vote against \`${target.user.tag}\`?`

    trace('sending reply')
    await ctx.reply({
      content,
      components: [buttons],
    })
  }
}
