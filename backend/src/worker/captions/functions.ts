import { decode } from 'html-entities'
import { anyOf, char, charNotIn, createRegExp, exactly, maybe, oneOrMore } from 'magic-regexp'
import striptags from 'striptags'
import * as errors from './errors'
import * as context from './context'

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
    throw new errors.ThrottlingSubtitleError()
  } else if (r.status !== 200) {
    throw new errors.UnknownSubtitleError(r)
  } else {
    return r
  }
}

export async function fetchVideo(videoId: string) {
  return (await fetch(`https://www.youtube.com/watch?v=${videoId}`)
    .then((r) => handleRequestError(r))
    .then((r) => r.text())) as string
}

export async function getCaptionTracks(data: string) {
  // * ensure we have access to captions data
  if (!data.includes('captionTracks'))
    throw new errors.MissingCaptionsFieldSubtitleError(
      `Could not find captions for video (1): ${context.get().videoId}`,
    )

  const captureResult = captionsJsonCapturer.exec(data)!
  if (!captureResult || !captureResult[0]) {
    throw new errors.MissingCaptionsFieldSubtitleError(
      `Could not find captions for video (2): ${context.get().videoId}`,
    )
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

  return captionTracks
}

export function getCaptionsLanguage(
  captionTracks: { languageCode: string; vssId: string; kind?: 'asr' | undefined; baseUrl: string }[],
) {
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
    throw new errors.MissingCaptionsSubtitleError(`Could not find captions for ${context.get().videoId}`)
  }
  return theLang
}

export function parseCaptions(transcript: string) {
  return transcript
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
}

export async function fetchCaptions(captionsUrl: string) {
  return await fetch(captionsUrl)
    .then((r) => handleRequestError(r))
    .then((r) => r.text())
}

export function getCaptionsUrl(
  captionTracks: { languageCode: string; vssId: string; kind?: 'asr' | undefined; baseUrl: string }[],
  lang: string,
) {
  const captionsData =
    captionTracks.find(({ vssId }) => vssId == `.${lang}`) ||
    captionTracks.find(({ vssId }) => vssId == `a.${lang}`) ||
    captionTracks.find(({ vssId }) => vssId?.match(`.${lang}`))
  // * ensure we have found the correct subtitle lang
  if (!captionsData || (captionsData && !captionsData.baseUrl))
    throw new errors.MissingLanguageSubtitleError(`Could not find ${lang} captions for ${context.get().videoId}`)

  return captionsData.baseUrl
}
