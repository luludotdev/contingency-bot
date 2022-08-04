import { dirname, importx } from '@discordx/importer'
import { exitHook } from '@lolpants/exit'
import { field } from '@lolpants/jogger'
import { EmbedBuilder, IntentsBitField as Intents } from 'discord.js'
import { Client } from 'discordx'
import ms from 'ms'
import { join as joinPath } from 'node:path/posix'
import { env, IS_DEV } from '~/env.js'
import { generateVoteButtons } from '~/lib/buttons.js'
import { Colours, VoteResult } from '~/lib/constants.js'
import { manager } from '~/lib/manager.js'
import { getVersion } from '~/lib/version.js'
import { sweepCache, syncMembers } from '~/lib/vote/utils.js'
import { ctxField, logger, userField } from '~/logger.js'

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
  logger.info(
    field('action', 'ready'),
    userField('user', client.user!),
    field('guild', field('id', env.GUILD_ID), field('name', guild.name))
  )

  await syncMembers(client)
  await sweepCache(client)
})

client.on('interactionCreate', interaction => {
  void client.executeInteraction(interaction)
})

export const run = async () => {
  const version = await getVersion()
  logger.info(
    ctxField('boot'),
    field('version', version),
    field('environment', IS_DEV ? 'dev' : 'prod')
  )

  const imports = joinPath(
    dirname(import.meta.url).replaceAll('\\', '/'),
    '/{commands,handlers,interactions}/**/*.{ts,js}'
  )

  await importx(imports)
  await client.login(env.TOKEN)
}

const expireInterval = setInterval(async () => {
  // Wait for client to be ready
  if (client.readyAt === null) return

  const expired = manager.getExpired()
  if (expired.length === 0) return

  logger.info(
    field('action', 'sweep-expired'),
    field('expired-count', expired.length)
  )

  for (const vote of expired) {
    const embed = EmbedBuilder.from(vote.message.embeds[0])
    embed.setColor(Colours.GREY)
    embed.setDescription(
      `~~${embed.data.description}~~\n**${VoteResult.EXPIRED}**`
    )

    const buttons = generateVoteButtons({ disabled: true })

    // eslint-disable-next-line no-await-in-loop
    await vote.message.edit({
      embeds: [embed],
      components: [buttons],
    })

    vote.cancel(undefined)
    logger.info(
      field('context', 'vote'),
      field('action', 'expired'),
      field('id', vote.message.id)
    )
  }
}, ms('60s'))

const sweepInterval = setInterval(async () => {
  // Wait for client to be ready
  if (client.readyAt === null) return

  await sweepCache(client)
}, ms('90s'))

exitHook(async exit => {
  clearInterval(expireInterval)
  clearInterval(sweepInterval)

  client.destroy()
  exit()
})
