import { PromisePool } from '@supercharge/promise-pool'
import { deleteQueueItem, existsVideoItem, getQueueItems, insertSubtitlePhraseItems, insertVideoItem } from '../db'
import { sleep } from '../utils'
import { getSubtitles } from './subtitles'

let run = true

export const start = async () => {
  while (run) {
    const items = await getQueueItems()
    if (items.length === 0) {
      console.log('No items in queue. Waiting 5 seconds...')
      await sleep(5000)
      continue
    }

    await PromisePool.withConcurrency(2)
      .for(items)
      .process(async (item) => {
        if (!run) return

        console.log('Processing video:', JSON.stringify(item))
        await deleteQueueItem(item.id)
        if (await existsVideoItem({ videoId: item.videoId })) {
          console.log('Video already exists. Skipping:', JSON.stringify(item))
          return
        }

        let subtitles: Awaited<ReturnType<typeof getSubtitles>>
        try {
          subtitles = await getSubtitles({ videoId: item.videoId })
        } catch (error) {
          console.error('Error while getting subtitles:', error)
          // insert video item so we don't try to get subtitles again
          await insertVideoItem({ ...item, lang: '' })
          return
        }
        const { lang, lines } = subtitles
        console.log('Subtitles obtained. Now saving results:', JSON.stringify(item))
        const { id: videoId } = await insertVideoItem({ ...item, lang })
        await insertSubtitlePhraseItems(
          lines
            .filter((line) => line.text !== '')
            .map((line) => ({ ...line, text: line.text.toLocaleLowerCase(), videoId })),
        )
        console.log('Saved result for video:', JSON.stringify(item))
      })
  }
}

export const stop = () => {
  run = false
}
