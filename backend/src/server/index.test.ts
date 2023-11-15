import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { _initializeApp } from '.'
import type { Operations } from '../db'

const mockedPassword =
  '$argon2id$v=19$m=65536,t=2,p=1$UROLLGfgvFkpZfGoiB4H1Fe/VR3uZMIZNUXRigMyGuo$8KfQPKwq0teAjHKPjaJtLXyNc7w67Rm1BBJsyxsmck0'
const mockedJwtToked =
  'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6NCwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIn0.xChPNmEi3fBwf1lW-tMVJBhU6VYXe9pvzpyEHRqeLog'
const mockedUserId = 4

const operationsMock = {
  queue: {
    insert: mock(() => null),
    get: mock(() => null),
    delete: mock(() => null),
  },
  video: {
    exists: mock(() => null),
    insert: mock(() => null),
    userRelation: {
      exists: mock(() => null),
      assign: mock(() => null),
    },
  },
  subtitlePhrase: {
    insert: mock(() => null),
    searchPart: mock(async () => [
      {
        cursor: 12,
        from: '0.01',
        duration: '1.23',
        text: 'something and other thing',
        videoId: 'the-video-id',
        lang: 'en',
        videoTitle: 'the video title',
        channelId: 'the-channel-id',
      },
    ]),
  },
  user: {
    insert: mock(() => ({
      id: mockedUserId,
      createdAt: 123456789,
      email: 'user@example.com',
      passwordHash: mockedPassword,
    })),
    get: mock(() => ({
      id: mockedUserId,
      createdAt: 123456789,
      email: 'user@example.com',
      passwordHash: mockedPassword,
    })),
  },
} as const

const handleRequest = (...args: Parameters<ReturnType<typeof _initializeApp>['handle']>) =>
  _initializeApp(operationsMock as unknown as Operations).handle(...args)

describe('Request handlers', () => {
  beforeEach(() => {
    operationsMock.queue.insert.mockClear()
    operationsMock.video.exists.mockClear()
    operationsMock.video.insert.mockClear()
    operationsMock.video.userRelation.exists.mockClear()
    operationsMock.video.userRelation.assign.mockClear()
    operationsMock.subtitlePhrase.insert.mockClear()
    operationsMock.subtitlePhrase.searchPart.mockClear()
    operationsMock.user.insert.mockClear()
    operationsMock.user.get.mockClear()
  })

  describe('Auth endpoints', () => {
    describe('When the register endpoint is called', () => {
      it('the user is registered', async () => {
        const response = await handleRequest(
          new Request('http://localhost/api/auth/signup', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify({ email: 'user@example.com', password: 'qweqwe' }),
          }),
        )
        expect(response.ok).toBeTrue()
        expect(await response.json()).toEqual({
          result: 'success',
          data: {
            token: mockedJwtToked,
          },
        })
        expect(
          operationsMock.user.insert.mock.calls as unknown as Array<Parameters<Operations['user']['insert']>>,
        ).toEqual([
          [
            {
              email: 'user@example.com',
              passwordHash: expect.stringContaining('argon2') as unknown as string,
            },
          ],
        ])
      })
    })

    describe('When the login endpoint is called', () => {
      it('the user is authenticated', async () => {
        const response = await handleRequest(
          new Request('http://localhost/api/auth/login', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify({ email: 'user@example.com', password: 'qweqwe' }),
          }),
        )
        expect(response.ok).toBeTrue()
        expect(await response.json()).toEqual({
          result: 'success',
          data: {
            token: expect.stringContaining('ey'),
          },
        })
        expect(operationsMock.user.get.mock.calls as unknown as Array<Parameters<Operations['user']['get']>>).toEqual([
          ['user@example.com'],
        ])
      })
    })
  })

  describe('Items endpoint', () => {
    describe("When the items endpoint it's POSTed", () => {
      it('should queue the items', async () => {
        const response = await handleRequest(
          new Request('http://localhost/api/v1/items', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              Authorization: 'Bearer ' + mockedJwtToked,
            },
            body: JSON.stringify([
              {
                videoTitle: 'Los MEJORES Cascos Gaming INALÁMBRICOS del 2022',
                videoId: 'Faon55nT8MI',
                channelId: '/@new3sc',
              },
              {
                videoTitle: 'My YouTuber merch is not the best.. :(',
                videoId: 'akxU62laPMk',
                channelId: '/@LinusTechTips',
              },
            ]),
          }),
        )
        expect(response.ok).toBeTrue()
        expect(await response.json()).toEqual({
          result: 'success',
          data: {
            item: 2,
          },
        })

        expect(
          operationsMock.queue.insert.mock.calls as unknown as Array<Parameters<Operations['queue']['insert']>>,
        ).toEqual([
          [
            [
              {
                videoTitle: 'Los MEJORES Cascos Gaming INALÁMBRICOS del 2022',
                videoId: 'Faon55nT8MI',
                channelId: '/@new3sc',
              },
              {
                videoTitle: 'My YouTuber merch is not the best.. :(',
                videoId: 'akxU62laPMk',
                channelId: '/@LinusTechTips',
              },
            ],
            mockedUserId,
          ],
        ])
      })
    })
  })

  describe('Search endpoint', () => {
    describe("When the search endpoint it's GETed", () => {
      describe('with search term and no page', () => {
        it('should return the search results', async () => {
          const response = await handleRequest(
            new Request('http://localhost/api/v1/search?q=something', {
              method: 'GET',
              headers: {
                'content-type': 'application/json',
                Authorization: 'Bearer ' + mockedJwtToked,
              },
            }),
          )
          expect(response.ok).toBeTrue()

          expect(
            operationsMock.subtitlePhrase.searchPart.mock.calls as unknown as Array<
              Parameters<Operations['subtitlePhrase']['searchPart']>
            >,
          ).toEqual([['something', { page: 1, userId: 4 }]])

          expect(await response.json()).toEqual({
            result: 'success',
            data: [
              {
                channelId: 'the-channel-id',
                cursor: 12,
                duration: '1.23',
                from: '0.01',
                lang: 'en',
                text: 'something and other thing',
                videoId: 'the-video-id',
                videoTitle: 'the video title',
              },
            ],
          })
        })
      })

      describe('with search term and page', () => {
        it('should return the search results', async () => {
          const response = await handleRequest(
            new Request('http://localhost/api/v1/search?q=something&p=213', {
              method: 'GET',
              headers: {
                'content-type': 'application/json',
                Authorization: 'Bearer ' + mockedJwtToked,
              },
            }),
          )
          expect(response.ok).toBeTrue()

          expect(
            operationsMock.subtitlePhrase.searchPart.mock.calls as unknown as Array<
              Parameters<Operations['subtitlePhrase']['searchPart']>
            >,
          ).toEqual([['something', { page: 213, userId: 4 }]])

          expect(await response.json()).toEqual({
            result: 'success',
            data: [
              {
                channelId: 'the-channel-id',
                cursor: 12,
                duration: '1.23',
                from: '0.01',
                lang: 'en',
                text: 'something and other thing',
                videoId: 'the-video-id',
                videoTitle: 'the video title',
              },
            ],
          })
        })
      })
    })
  })
})
