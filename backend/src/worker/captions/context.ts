import { AsyncLocalStorage } from 'async_hooks'

// TODO: use utils/context.ts instead
type ContextData = { videoId: string }
const context = new AsyncLocalStorage<ContextData>()

export const wrap = <T extends (...args: any[]) => any>(data: ContextData, f: T) => {
  return context.run(data, f) as ReturnType<T>
}

export const get = () => {
  const data = context.getStore()
  if (!data) throw new Error('Context not initialized')
  return data
}
