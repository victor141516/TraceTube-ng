export * from './errors'
import {
  fetchCaptions,
  fetchVideo,
  getCaptionTracks,
  getCaptionsLanguage,
  getCaptionsUrl,
  parseCaptions,
} from './functions'
import * as context from './context'

export type CaptionsData = {
  lang: string
  lines: Array<{ from: string; duration: string; text: string }>
}

export async function getCaptions({ videoId }: { videoId: string }): Promise<CaptionsData> {
  return await context.wrap({ videoId }, async () => {
    const data = await fetchVideo(videoId)

    const captionTracks = await getCaptionTracks(data)
    const lang = getCaptionsLanguage(captionTracks)
    const captionsUrl = getCaptionsUrl(captionTracks, lang)
    const transcript = await fetchCaptions(captionsUrl)
    const lines = parseCaptions(transcript)
    return { lang: lang, lines }
  })
}
