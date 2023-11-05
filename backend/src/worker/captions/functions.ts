import { decode } from 'html-entities'
import { anyOf, char, charNotIn, createRegExp, exactly, maybe, oneOrMore } from 'magic-regexp'
import striptags from 'striptags'
import * as errors from './errors'
import { getContext } from '../../utils/context'

const context = getContext<{ videoId: string }>()

const captionsJsonCapturer = createRegExp(
  exactly('{"captionTracks":'),
  maybe(oneOrMore(char)),
  exactly('isTranslatable":'),
  anyOf('true', 'false'),
  maybe(oneOrMore(charNotIn('}'))),
  maybe(oneOrMore(charNotIn(']'))),
  exactly(']'),
)

async function handleRequestError(r: Response) {
  if (r.status === 429) {
    throw new errors.ThrottlingSubtitleError()
  } else if (r.status !== 200) {
    throw new errors.UnknownSubtitleError(`Unknown error: ${r.status}, ${await r.clone().text()}`)
  } else {
    return r
  }
}

async function guardedFetch(captionsUrl: string) {
  return await fetch(captionsUrl)
    .then((r) => handleRequestError(r))
    .then((r) => r.text())
}

export async function fetchVideo(videoId: string) {
  return await guardedFetch(`https://www.youtube.com/watch?v=${videoId}`)
}

export function getCaptionTracks(data: string) {
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
  // Find the first non-generated caption
  const generatedCaptionsLanguage = captionTracks.find((e) => e.kind === 'asr')?.languageCode
  if (generatedCaptionsLanguage) {
    return generatedCaptionsLanguage.slice(0, 2)
  }

  // If there are no generated captions, just use the first non-generated caption
  const nonGeneratedCaptions = captionTracks.filter((e) => e.kind !== 'asr')
  return nonGeneratedCaptions[0]?.languageCode.slice(0, 2)
}

// TODO: replace this with a proper xml parser
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
  return guardedFetch(captionsUrl)
}

export function getCaptionsUrl(
  captionTracks: { languageCode: string; vssId: string; kind?: 'asr' | undefined; baseUrl: string }[],
  // lang is the generated caption language code
  lang: string,
) {
  const captionsData =
    // .xx (without a.) is the non-generated caption. Prefer this over the generated caption
    captionTracks.find(({ vssId }) => vssId == `.${lang}`) ||
    // a.xx is the generated caption. Use this if there is no non-generated caption
    captionTracks.find(({ vssId }) => vssId == `a.${lang}`) ||
    // we're sure that there is a caption track with the given language code, so the lang must have some locale suffix. use match to find it
    captionTracks.find(({ vssId }) => vssId?.match(`\.${lang}`))

  // * ensure we have found the correct subtitle lang
  if (!captionsData || (captionsData && !captionsData.baseUrl))
    throw new errors.MissingLanguageSubtitleError(`Could not find ${lang} captions for ${context.get().videoId}`)

  return captionsData.baseUrl
}
