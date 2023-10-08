import * as config from './config'
import * as db from './db'
import * as server from './server'
import * as worker from './worker'

db.initialize({ databaseUri: config.DATABASE_URI })

if (config.MODE === 'server') {
  const app = server.start({ port: config.PORT })
  console.log(`🦊 Server is running at ${app.server?.hostname}:${app.server?.port}`)
} else {
  worker.start()
}
