import { expect, it, describe, mock, afterEach } from 'bun:test'
import * as functions from '../functions'
import * as errors from '../errors'
import { getContext, MissingContextError } from '../../../utils/context'
import * as testData from './data'

const restoreFetch = () => {
  globalThis.fetch = () => {
    throw new Error('fetch not mocked')
  }
}
const mockFetch = (code: number, data: string) => {
  globalThis.fetch = mock(async () => new Response(data, { status: code }))
}

const context = getContext()
const mockContext = (f: Parameters<typeof context.wrap>[1]) => context.wrap({ videoId: 'the-video-id' }, f)

describe('context', () => {
  describe('when the context is used with wrap', () => {
    it('should get the context data', () => {
      expect(mockContext(() => context.get())).toStrictEqual({ videoId: 'the-video-id' })
    })
  })

  describe('when the context is used without wrap', () => {
    it('should throw', () => {
      expect(() => {
        context.get()
      }).toThrow(MissingContextError as ErrorConstructor)
    })
  })
})

describe('functions', () => {
  afterEach(() => {
    restoreFetch()
  })

  describe('fetchVideo', () => {
    describe('happy path', () => {
      it('should fetch video', async () => {
        mockFetch(200, 'response-data')
        const video = await functions.fetchVideo('videoId')
        expect(video).toBe('response-data')
      })
    })

    describe('if throttling', () => {
      it('should fail', () => {
        mockFetch(429, '')
        expect(async () => {
          await functions.fetchVideo('videoId')
        }).toThrow(errors.ThrottlingSubtitleError as ErrorConstructor)
      })
    })

    describe('if status code is not 200', () => {
      it('should fail', () => {
        mockFetch(404, 'the-error')
        expect(async () => {
          await functions.fetchVideo('videoId')
        }).toThrow(errors.UnknownSubtitleError as ErrorConstructor)
      })
    })
  })

  describe('fetchCaptions', () => {
    describe('happy path', () => {
      it('should fetch video', async () => {
        mockFetch(200, 'response-data')
        const video = await functions.fetchCaptions('videoId')
        expect(video).toBe('response-data')
      })
    })

    describe('if throttling', () => {
      it('should fail', () => {
        mockFetch(429, '')
        expect(async () => {
          await functions.fetchCaptions('videoId')
        }).toThrow(errors.ThrottlingSubtitleError as ErrorConstructor)
      })
    })

    describe('if status code is not 200', () => {
      it('should fail', () => {
        mockFetch(404, 'the-error')
        expect(async () => {
          await functions.fetchCaptions('videoId')
        }).toThrow(errors.UnknownSubtitleError as ErrorConstructor)
      })
    })
  })

  describe('getCaptionTracks', () => {
    describe('happy path', () => {
      it('should get the captions', () => {
        expect(functions.getCaptionTracks(testData.videoResponseOk)).toStrictEqual([
          {
            baseUrl:
              'https://www.youtube.com/api/timedtext?v=Qj0Qx8HpNUo&ei=iWVGZdL6Lou3hcIPuaC96Ac&caps=asr&opi=112496729&xoaf=5&hl=es&ip=0.0.0.0&ipbits=0&expire=1699137529&sparams=ip,ipbits,expire,v,ei,caps,opi,xoaf&signature=324CD021FE575C336CC96FC5DFE8F78128736745.0D8DCA9D69C9618E80000C3D7FD72B55C51FB7C1&key=yt8&kind=asr&lang=en',
            isTranslatable: true,
            kind: 'asr',
            languageCode: 'en',
            name: {
              simpleText: 'Inglés (generados automáticamente)',
            },
            trackName: '',
            vssId: 'a.en',
          },
        ])
      })
    })

    describe('if the response is weird and doesnt contain captions data', () => {
      it('should fail gracefully', () => {
        expect(() => mockContext(() => functions.getCaptionTracks('ehehehehehe u pwnd'))).toThrow(
          errors.MissingCaptionsFieldSubtitleError as ErrorConstructor,
        )
      })
    })

    describe('if the response looks good but still doesnt contain captions data', () => {
      it('should fail gracefully', () => {
        expect(() => mockContext(() => functions.getCaptionTracks('ehehehehehe u pwnd !!! captionTracks !!!'))).toThrow(
          errors.MissingCaptionsFieldSubtitleError as ErrorConstructor,
        )
      })
    })
  })

  describe('getCaptionsLanguage', () => {
    describe('when there is generated caption', () => {
      it('should get the captions', () => {
        expect(
          functions.getCaptionsLanguage([
            {
              baseUrl:
                'https://www.youtube.com/api/timedtext?v=Qj0Qx8HpNUo&ei=HmpGZdb0LNmwxN8P8JGr-A0&caps=asr&opi=112496729&xoaf=5&hl=es&ip=0.0.0.0&ipbits=0&expire=1699138702&sparams=ip,ipbits,expire,v,ei,caps,opi,xoaf&signature=0DF2986F522DD9F173855264EF58B7F48BF0C988.3192334FAFA30752F895466796C39E7CF8787A78&key=yt8&kind=asr&lang=en',
              vssId: 'a.en',
              languageCode: 'zz-and-other-stuff',
              kind: 'asr',
            },
          ]),
        ).toStrictEqual('zz')
      })
    })

    describe('when there is no generated caption', () => {
      it('should get the captions', () => {
        expect(
          functions.getCaptionsLanguage([
            {
              baseUrl:
                'https://www.youtube.com/api/timedtext?v=Qj0Qx8HpNUo&ei=HmpGZdb0LNmwxN8P8JGr-A0&caps=asr&opi=112496729&xoaf=5&hl=es&ip=0.0.0.0&ipbits=0&expire=1699138702&sparams=ip,ipbits,expire,v,ei,caps,opi,xoaf&signature=0DF2986F522DD9F173855264EF58B7F48BF0C988.3192334FAFA30752F895466796C39E7CF8787A78&key=yt8&kind=asr&lang=en',
              vssId: '.en',
              languageCode: 'yy-and-other-stuff',
            },
          ]),
        ).toStrictEqual('yy')
      })
    })
  })

  describe('getCaptionsUrl', () => {
    describe('when there is a non-generated caption that matched the generated one', () => {
      it('should return it', () => {
        expect(
          functions.getCaptionsUrl(
            [
              {
                baseUrl: 'url1',
                vssId: 'a.zz',
                languageCode: 'zz-and-other-stuff',
                kind: 'asr',
              },
              {
                baseUrl: 'url2',
                vssId: '.zz',
                languageCode: 'zz-and-other-stuff',
              },
            ],
            'zz',
          ),
        ).toStrictEqual('url2')
      })
    })

    describe('when there is no non-generated caption that matched the generated one', () => {
      it('should return it', () => {
        expect(
          functions.getCaptionsUrl(
            [
              {
                baseUrl: 'url1',
                vssId: 'a.zz',
                languageCode: 'zz-and-other-stuff',
                kind: 'asr',
              },
            ],
            'zz',
          ),
        ).toStrictEqual('url1')
      })
    })

    describe('when there is a non-generated caption that matched the generated one but it has a locale suffix', () => {
      it('should return it', () => {
        expect(
          functions.getCaptionsUrl(
            [
              {
                baseUrl: 'url1',
                vssId: '.yy',
                languageCode: 'zz-and-other-stuff',
              },
              {
                baseUrl: 'url2',
                vssId: '.zz-MY-GOD-I-HATE-THIS-CRAP',
                languageCode: 'zz-and-other-stuff',
                kind: 'asr',
              },
            ],
            'zz',
          ),
        ).toStrictEqual('url2')
      })
    })

    describe('when there is no caption that matches', () => {
      it('should return it', () => {
        expect(() => mockContext(() => functions.getCaptionsUrl([], 'zz'))).toThrow(
          errors.MissingLanguageSubtitleError as ErrorConstructor,
        )
      })
    })
  })

  describe('parseCaptions', () => {
    describe('', () => {
      it('', () => {
        expect(
          functions.parseCaptions(`<?xml version="1.0" encoding="utf-8" ?>
            <transcript>
                <text start="0.24" dur="3.52">hello my friend and Friends someone</text>
                <text start="1.88" dur="3.6">recently shared this site with me and</text>
                <text start="3.76" dur="3.44">asked how we could do this like kind of</text>
                <text start="5.48" dur="3.4">cool paralex effecta that&amp;#39;s going on we</text>
            </transcript>`),
        ).toStrictEqual([
          {
            duration: '3.52',
            from: '0.24',
            text: '\n            \n                hello my friend and Friends someone',
          },
          {
            duration: '3.6',
            from: '1.88',
            text: '\n                recently shared this site with me and',
          },
          {
            duration: '3.44',
            from: '3.76',
            text: '\n                asked how we could do this like kind of',
          },
          {
            duration: '3.4',
            from: '5.48',
            text: "\n                cool paralex effecta that's going on we",
          },
        ])
      })
    })
  })
})
