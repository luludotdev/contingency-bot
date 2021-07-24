declare module 'discord.js' {
  interface Message {
    lineReply(
      content:
        | APIMessageContentResolvable
        | (MessageOptions & { split?: false })
        | MessageAdditions
    ): Promise<Message>
    lineReply(
      options: MessageOptions & { split: true | SplitOptions }
    ): Promise<Message[]>
    lineReply(options: MessageOptions): Promise<Message | Message[]>
    lineReply(
      content: StringResolvable,
      options: (MessageOptions & { split?: false }) | MessageAdditions
    ): Promise<Message>
    lineReply(
      content: StringResolvable,
      options: MessageOptions & { split: true | SplitOptions }
    ): Promise<Message[]>
    lineReply(
      content: StringResolvable,
      options: MessageOptions
    ): Promise<Message | Message[]>
  }
}
