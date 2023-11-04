import { AsyncLocalStorage } from 'async_hooks'
import * as errors from './errors'

type ContextData = { videoId: string }
const context = new AsyncLocalStorage<ContextData>()

export const wrap = <T extends (...args: any[]) => any>(data: ContextData, f: T) => {
  return context.run(data, f) as ReturnType<T>
}

export const get = () => {
  const data = context.getStore()
  if (!data) throw new errors.MissingContextError('Context not initialized')
  return data
}
