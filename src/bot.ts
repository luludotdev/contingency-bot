import { clearInterval, setInterval } from 'node:timers'
import { exitHook } from '@luludev/exit'
import { EmbedBuilder, IntentsBitField as Intents } from 'discord.js'
import { Client } from 'discordx'
import ms from 'ms'
import { env, IS_DEV } from '~/env.js'
import { generateVoteButtons } from '~/lib/buttons.js'
import { Colours, VoteResult } from '~/lib/constants.js'
import { manager } from '~/lib/manager.js'
import { getVersion } from '~/lib/version.js'
import { action, context, logger, userField } from '~/logger.js'

const client = new Client({
  silent: true,
  intents: [
    Intents.Flags.Guilds,
    Intents.Flags.GuildMessages,
    Intents.Flags.GuildMembers,
  ],
  botGuilds: [env.GUILD_ID],
})

client.once('ready', async () => {
  await client.guilds.fetch()
  await client.initApplicationCommands()

  const guild = await client.guilds.fetch(env.GUILD_ID)!
  logger.info({
    ...action('ready'),
    user: userField(client.user!),
    guild: {
      id: env.GUILD_ID,
      name: guild.name,
    },
  })
})

client.on('interactionCreate', interaction => {
  void client.executeInteraction(interaction)
})

export const run = async () => {
  const version = await getVersion()
  logger.info({
    ...context('boot'),
    version,
    environment: IS_DEV ? 'dev' : 'prod',
  })

  await Promise.all([
    import('~/commands/index.js'),
    import('~/handlers/index.js'),
    import('~/interactions/index.js'),
  ])

  await client.login(env.TOKEN)
}

const expireInterval = setInterval(async () => {
  // Wait for client to be ready
  if (client.readyAt === null) return

  const expired = manager.getExpired()
  if (expired.length === 0) return

  logger.info({
    ...action('sweep-expired'),
    'expired-count': expired.length,
  })

  for (const vote of expired) {
    const embed = EmbedBuilder.from(vote.message.embeds[0])
    embed.setColor(Colours.GREY)
    embed.setDescription(
      `~~${embed.data.description}~~\n**${VoteResult.EXPIRED}**`,
    )

    const buttons = generateVoteButtons({ disabled: true })

    // eslint-disable-next-line no-await-in-loop
    await vote.message.edit({
      embeds: [embed],
      components: [buttons],
    })

    vote.cancel(undefined)
    logger.info({
      ...context('expire-interval'),
      ...action('expired'),
      id: vote.message.id,
    })
  }
}, ms('60s'))

exitHook(async exit => {
  clearInterval(expireInterval)

  await client.destroy()
  exit()
})
