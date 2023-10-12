import { decode } from 'html-entities'
import { anyOf, char, charNotIn, createRegExp, exactly, maybe, oneOrMore } from 'magic-regexp'
import striptags from 'striptags'

export class SubtitleError {
  args: any[]
  constructor(...args: any[]) {
    this.args = args
  }
}
export class ThrottlingSubtitleError extends SubtitleError {}
export class UnknownSubtitleError extends SubtitleError {}
export class MissingCaptionsFieldSubtitleError extends SubtitleError {}
export class MissingCaptionsSubtitleError extends SubtitleError {}
export class MissingLanguageSubtitleError extends SubtitleError {}

const captionsJsonCapturer = createRegExp(
  exactly('{"captionTracks":'),
  maybe(oneOrMore(char)),
  exactly('isTranslatable":'),
  anyOf('true', 'false'),
  maybe(oneOrMore(charNotIn('}'))),
  maybe(oneOrMore(charNotIn(']'))),
  exactly(']'),
)

function handleRequestError(r: Response) {
  if (r.status === 429) {
    throw new ThrottlingSubtitleError()
  } else if (r.status !== 200) {
    throw new UnknownSubtitleError(r)
  } else {
    return r
  }
}

export async function getSubtitles({ videoId }: { videoId: string }) {
  const data = (await fetch(`https://youtube.com/watch?v=${videoId}`)
    .then((r) => handleRequestError(r))
    .then((r) => r.text())) as string

  // * ensure we have access to captions data
  if (!data.includes('captionTracks'))
    throw new MissingCaptionsFieldSubtitleError(`Could not find captions for video (1): ${videoId}`)

  const captureResult = captionsJsonCapturer.exec(data)!
  if (!captureResult || !captureResult[0]) {
    throw new MissingCaptionsFieldSubtitleError(`Could not find captions for video (2): ${videoId}`)
  }
  const captionTracks = (
    JSON.parse(`${captureResult[0]}}`) as {
      captionTracks: {
        languageCode: string
        vssId: string
        kind?: 'asr'
        baseUrl: string
      }[]
    }
  ).captionTracks

  const generatedCaptionsLanguage = captionTracks.find((e) => e.kind === 'asr')?.languageCode
  const nonGeneratedCaptions = captionTracks.filter((e) => e.kind !== 'asr')
  let theLang: string | undefined
  if (generatedCaptionsLanguage) {
    // Find the first non-generated caption that matches the generated caption language i.e. the original language
    theLang = nonGeneratedCaptions.find((e) => e.languageCode === generatedCaptionsLanguage)?.languageCode.slice(0, 2)
  } else {
    // If there are no generated captions, just use the first non-generated caption
    theLang = nonGeneratedCaptions[0]?.languageCode.slice(0, 2)
  }

  if (!theLang) {
    // If there are no non-generated captions, use the generated caption
    theLang = captionTracks.find((e) => e.languageCode === generatedCaptionsLanguage)?.languageCode.slice(0, 2)
  }

  if (!theLang) {
    throw new MissingCaptionsSubtitleError(`Could not find captions for ${videoId}`)
  }

  const subtitle =
    captionTracks.find(({ vssId }) => vssId == `.${theLang}`) ||
    captionTracks.find(({ vssId }) => vssId == `a.${theLang}`) ||
    captionTracks.find(({ vssId }) => vssId?.match(`.${theLang}`))

  // * ensure we have found the correct subtitle lang
  if (!subtitle || (subtitle && !subtitle.baseUrl))
    throw new MissingLanguageSubtitleError(`Could not find ${theLang} captions for ${videoId}`)

  const transcript = await fetch(subtitle.baseUrl)
    .then((r) => handleRequestError(r))
    .then((r) => r.text())
  const lines = transcript
    .replace('<?xml version="1.0" encoding="utf-8" ?><transcript>', '')
    .replace('</transcript>', '')
    .split('</text>')
    .filter((line) => line?.trim())
    .map((line) => {
      const startRegex = /start="([\d.]+)"/
      const durRegex = /dur="([\d.]+)"/

      const [, start] = startRegex.exec(line)!
      const [, dur] = durRegex.exec(line)!

      const htmlText = line
        .replace(/<text.+>/, '')
        .replace(/&amp;/gi, '&')
        .replace(/<\/?[^>]+(>|$)/g, '')

      const decodedText = decode(htmlText)
      const text = striptags(decodedText)

      return {
        from: start,
        duration: dur,
        text,
      }
    })

  return { lang: theLang, lines }
}
