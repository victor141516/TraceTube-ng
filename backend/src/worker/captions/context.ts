import { AsyncLocalStorage } from 'async_hooks'

type ContextData = { videoId: string }
const context = new AsyncLocalStorage<ContextData>()

export const wrap = <T extends (...args: any[]) => any>(data: ContextData, f: T) => {
  return context.run(data, f) as ReturnType<T>
}

export const get = () => {
  return context.getStore()!
}
