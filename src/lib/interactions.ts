export const interactionRX = (context: string, id: string): RegExp =>
  new RegExp(`^${context}@${id}/?`)

export const interactionID = (
  context: string,
  id: string,
  ...components: string[]
): string => {
  const start = `${context}@${id}`
  if (components.length === 0) return start

  const joined = components.join('/')
  return `${start}/${joined}`
}

type ParsedInteraction = {
  readonly context: string
  readonly id: string
  readonly key: string
  readonly components: string[]
}

export const parseInteractionID: (id: string) => ParsedInteraction = rawID => {
  const [key, ...components] = rawID.split('/')
  const [context, id] = key.split('@')

  return { context, id, key, components }
}
