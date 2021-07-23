export const sleepMS: (ms: number) => Promise<void> = async ms =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
