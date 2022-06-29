import { dirname, importx } from '@discordx/importer'
import { exitHook } from '@lolpants/exit'
import { field } from '@lolpants/jogger'
import { Intents } from 'discord.js'
import { Client } from 'discordx'
import { join as joinPath } from 'node:path/posix'
import { env, IS_DEV } from '~/env.js'
import { sweepCache, syncMembers } from '~/lib/vote/utils.js'
import { ctxField, logger, userField } from '~/logger.js'
import { getVersion } from '~/version.js'

const client = new Client({
  silent: true,
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MEMBERS,
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

exitHook(async exit => {
  client.destroy()
  exit()
})
