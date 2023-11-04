import { PromisePool } from '@supercharge/promise-pool'
import {
  deleteQueueItem,
  existsVideoItem,
  getQueueItems,
  insertQueueItems,
  insertSubtitlePhraseItems,
  insertVideoItem,
} from '../db'
import { sleep } from '../utils'
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
    const items = await getQueueItems()
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
        if (!run) return
        if (throttling) return

        console.log('Processing video:', JSON.stringify(item))
        await deleteQueueItem(item.id)
        if (await existsVideoItem({ videoId: item.videoId })) {
          // TODO:
          // Check if the video-user pair already exists
          // If so -->
          console.log('Video already exists. Skipping:', JSON.stringify(item))
          return
          // If not -->
          // Create the relation between the user and the video
        }

        let captions: CaptionsData
        try {
          captions = await getCaptions({ videoId: item.videoId })
          retryCount = 0
        } catch (error) {
          if (error instanceof ThrottlingSubtitleError) {
            throttling = true
            retryCount++
            console.log('Throttling error...')
            await insertQueueItems([{ ...item, videoTitle: item.title }], item.userId)
            return
          } else {
            console.error('Error while getting subtitles:', error)
            // insert video item so we don't try to get subtitles again
            await insertVideoItem({ ...item, lang: '' })
            return
          }
        }
        const { lang, lines } = captions
        console.log('Subtitles obtained. Now saving results:', JSON.stringify(item))
        const { id: videoId } = await insertVideoItem({ ...item, lang })
        await insertSubtitlePhraseItems(
          lines
            .filter((line) => line.text !== '')
            .map((line) => ({ ...line, text: line.text.toLocaleLowerCase(), videoId })),
        )
        console.log('Saved result for video:', JSON.stringify(item))
        await sleep(30000)
      })
  }
}

export const stop = () => {
  run = false
}
