import { AsyncLocalStorage } from 'async_hooks'

/**
 * Usage:
 *  - `getContext` returns an object with all the methods. This is needed only for the types, but the functions inside can be used in any way.
 *    - This is mostly syntactic sugar on AsyncLocalStorage. It doesn't add any logic. The only added thing is the console
 *  - `wrap` is the same as `AsyncLocalStorage.run`, but it's typed
 *  - `get` returns the current context with the correct type. If the context is not initialized, it throws an error
 *  - `console` is a custom console that adds the context to the log
 */

const context = new AsyncLocalStorage()

export class MissingContextError extends Error {}

export const getContext = <Data,>() => {
  const wrap = <Fn extends (...args: any[]) => any>(data: Data, f: Fn) => {
    return context.run(data, f) as ReturnType<Fn>
  }

  const get = () => {
    const data = context.getStore()
    if (!data) {
      throw new MissingContextError('Context not initialized')
    }
    return data as Data
  }

  const getPrefix = () => `[${JSON.stringify(get())}]`
  const customConsole = {
    log: (...args: any[]) => console.log(getPrefix(), ...args),
    error: (...args: any[]) => console.error(getPrefix(), ...args),
    warn: (...args: any[]) => console.warn(getPrefix(), ...args),
    info: (...args: any[]) => console.info(getPrefix(), ...args),
    debug: (...args: any[]) => console.debug(getPrefix(), ...args),
  }

  return {
    wrap,
    get,
    console: customConsole,
  }
}
