import { PromisePool } from '@supercharge/promise-pool'
import * as db from '../db'
import { sleep } from '../utils'
import { Context } from '../utils/context'
import { CaptionsData, ThrottlingSubtitleError, getCaptions } from './captions'

let run = true

export const start = async () => {
  let throttling = false
  let retryCount = 1
  while (run) {
    if (throttling) {
      console.log(`Throttling state. Waiting ${retryCount * 5} seconds...`)
      await sleep(retryCount * 5000)
      throttling = false
      console.log('Throttling state ended. Continuing...')
      continue
    }
    const items = await db.queue.get()
    if (items.length === 0) {
      console.log('No items in queue. Waiting 5 seconds...')
      await sleep(5000)
      continue
    }

    await PromisePool.withConcurrency(2)
      .for(items)
      .handleError((error) => {
        console.error('Error while processing queue items:', error)
        throw error
      })
      .process(async (item) => {
        const context = new Context({ videoId: item.videoId })
        await context.wrap(async () => {
          if (!run) return
          if (throttling) return

          context.console.log('Processing video')
          await db.queue.delete(item.id)

          if (await db.video.exists({ videoId: item.videoId })) {
            const relation = { userId: item.userId, videoId: item.videoId }

            if (await db.video.userRelation.exists(relation)) {
              context.console.log('Video already exists and it belongs to the current user. Skipping')
            } else {
              context.console.log(
                'Video already exists but it belongs to a different user. Assigning the video to this user and ending here',
              )
              await db.video.userRelation.assign(relation)
            }
            return
          }

          let captions: CaptionsData
          try {
            captions = await getCaptions({ videoId: item.videoId })
            retryCount = 0
          } catch (error) {
            if (error instanceof ThrottlingSubtitleError) {
              throttling = true
              retryCount++
              context.console.log('Throttling error...')
              await db.queue.insert([{ ...item, videoTitle: item.title }], item.userId)
              return
            } else {
              context.console.error('Error while getting subtitles:', error)
              // insert video item so we don't try to get subtitles again
              await db.video.insert({ ...item, lang: '' })
              return
            }
          }
          const { lang, lines } = captions
          context.console.log('Subtitles obtained. Now saving results')
          const { id: videoId } = await db.video.insert({ ...item, lang })
          await db.subtitlePhrase.insert(
            lines
              .filter((line) => line.text !== '')
              .map((line) => ({ ...line, text: line.text.toLocaleLowerCase(), videoId })),
          )
          context.console.log('Saved result for video')
          await sleep(30000)
        })
      })
  }
}

export const stop = () => {
  run = false
}
