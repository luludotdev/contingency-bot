export const interactionRX: (context: string, id: string) => RegExp = (
  context,
  id,
) => new RegExp(`^${context}@${id}/?`)

export const interactionID: (
  context: string,
  id: string,
  ...components: string[]
) => string = (context, id, ...components) => {
  const start = `${context}@${id}`
  if (components.length === 0) return start

  const joined = components.join('/')
  return `${start}/${joined}`
}

interface ParsedInteraction {
  context: string
  id: string
  key: string
  components: string[]
}

export const parseInteractionID: (id: string) => ParsedInteraction = rawID => {
  const [key, ...components] = rawID.split('/')
  const [context, id] = key.split('@')

  return { context, id, key, components }
}
