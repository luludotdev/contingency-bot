import { Reply } from '~constants.js'
import type { Handler } from '~interactions/index.js'
import { cancelConfirmation, checkUserID } from './utils.js'

export const init__cancel: Handler = async ({ button, components }) => {
  const [userID, messageID] = components

  const isUser = await checkUserID(button, userID)
  if (!isUser) return

  await cancelConfirmation(button, Reply.VOTE_CANCELLED, 1500)

  const message = button.message.channel.messages.resolve(messageID)
  if (message?.deletable) await message.delete()
}
