import 'source-map-support/register.js'

import { field } from '@lolpants/jogger'
import buttons, { MessageButton } from 'discord-buttons'
import { Client } from 'discord.js'
import { GUILD_ID, TOKEN } from './env/index.js'
import { exitHook } from './exit.js'
import { errorField, flush, logger } from './logger.js'

const client = new Client()
buttons(client)

client.on('ready', () => {
  logger.info(
    field('action', 'ready'),
    field('user', client.user?.tag ?? 'Unknown')
  )
})

client.on('message', async message => {
  if (message.author.bot) return
  if (message.guild === null) return
  if (message.member === null) return
  if (message.guild.id !== GUILD_ID) return

  // TODO: Role Checks

  const prefix = 'c!startvote '
  if (!message.content.toLowerCase().startsWith(prefix)) return

  const content = message.content.slice(prefix.length)
  const targetID = content.replace(/<@!?(\d+)>/, '$1')

  const target = message.guild.member(targetID)
  if (target === null) {
    await message.reply('Could not resolve a user with that ID!')
    return
  }

  if (target.id === message.author.id) {
    await message.reply('You cannot start a vote against yourself!')
    return
  }

  const confirmButton = new MessageButton()
    .setLabel('Confirm')
    .setID(`confirm/${message.author.id}`)
    .setStyle('green')

  const cancelButton = new MessageButton()
    .setLabel('Cancel')
    .setID(`cancel/${message.author.id}`)
    .setStyle('red')

  await message.channel.send(
    `Are you sure you want to start a vote against \`${target.user.tag}\`?`,
    {
      buttons: [confirmButton, cancelButton],
    }
  )
})

client.on('clickButton', async button => {
  const [id, userID] = button.id.split('/')
  if (!id || !userID) return

  if (button.clicker.id !== userID) {
    await button.reply.send(
      'Only the user who started the vote can confirm or cancel.',
      // @ts-expect-error
      true
    )

    return
  }

  if (id === 'cancel') {
    await button.reply.defer(true)

    const confirmButton = new MessageButton()
      .setLabel('Confirm')
      .setID(`confirm/${userID}`)
      .setStyle('green')
      .setDisabled(true)

    const cancelButton = new MessageButton()
      .setLabel('Cancel')
      .setID(`cancel/${userID}`)
      .setStyle('red')
      .setDisabled(true)

    await button.message.edit('Vote Cancelled', {
      buttons: [confirmButton, cancelButton],
    })

    await sleepMS(1000)
    if (button.message.deletable) await button.message.delete()
  }
})

exitHook(async (exit, error) => {
  client.destroy()
  if (error) {
    logger.error(errorField(error))
  } else {
    logger.info(field('action', 'shutdown'))
  }

  await flush()
  exit()
})

void client.login(TOKEN)
