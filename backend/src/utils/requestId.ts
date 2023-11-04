import { AsyncLocalStorage } from 'async_hooks'

const asyncLocalStorage = new AsyncLocalStorage()

export const wrap = <T extends () => unknown>(requestId: string, fn: T) =>
  asyncLocalStorage.run(requestId, fn) as ReturnType<T>
export const get = () => asyncLocalStorage.getStore() as string | undefined

const print =
  (level: 'log' | 'error' | 'warn' | 'info' | 'debug' | 'trace') =>
  (messages: Parameters<typeof console.log>, requestId?: string) => {
    if (!requestId) requestId = get()
    console[level](`${requestId ? `[${requestId}] ` : ''}`, ...messages)
  }

const thisConsole = {
  log: print('log'),
  error: print('error'),
  warn: print('warn'),
  info: print('info'),
  debug: print('debug'),
  trace: print('trace'),
}

export { thisConsole as console }
