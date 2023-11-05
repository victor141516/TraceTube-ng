import { AsyncLocalStorage } from 'async_hooks'

export class MissingContextError extends Error {}
export class Context<Data> {
  private context: AsyncLocalStorage<Data>

  constructor(private data: Data) {
    this.context = new AsyncLocalStorage<Data>()
  }

  wrap<T extends (...args: any[]) => any>(f: T) {
    return this.context.run(this.data, f) as ReturnType<T>
  }

  get() {
    const data = this.context.getStore()
    if (!data) throw new MissingContextError('Context not initialized')
    return data
  }

  get console() {
    const prefix = `[${JSON.stringify(this.get())}]`
    return {
      log: (...args: any[]) => console.log(prefix, ...args),
      error: (...args: any[]) => console.error(prefix, ...args),
      warn: (...args: any[]) => console.warn(prefix, ...args),
      info: (...args: any[]) => console.info(prefix, ...args),
      debug: (...args: any[]) => console.debug(prefix, ...args),
    }
  }
}
