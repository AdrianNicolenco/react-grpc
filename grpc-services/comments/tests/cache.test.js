import Redis from 'ioredis'
import faker from 'faker'

import logger from '../src/logger'
import CacheService from '../src/services/cache.service'
import CacheMiddleware from '../src/middlewares/cache.middleware'

describe('Cache Testing', () => {
  const redisConnOpts = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
  const cacheService = new CacheService(new Redis(redisConnOpts), logger)
  const cacheMiddleware = new CacheMiddleware(cacheService, logger)

  describe('CacheService', () => {
    test('#should cache values on set ', async () => {
      let key = faker.random.alphaNumeric(24)
      let data = {
        text: faker.random.alphaNumeric(24),
        post: faker.random.uuid(),
        author: faker.random.uuid()
      }

      const setResult = await cacheService.set(key, data)

      expect(setResult).toBe('OK')

      const res = await cacheService.get(key)

      // Stucture check/s
      expect(res).toContainAllKeys([
        'text',
        'post',
        'author'
      ])

      // Type check/s
      expect(res.text).toBeString()
      expect(res.post).toBeString()
      expect(res.author).toBeString()

      // Value check/s
      expect(res.text).toBe(data.text)
      expect(res.post).toBe(data.post)
      expect(res.author).toBe(data.author)

      return
    })

    test('#should remove a single entry on remove ', async () => {
      let key = faker.random.alphaNumeric(24)
      let data = {
        text: faker.random.alphaNumeric(24),
        post: faker.random.uuid(),
        author: faker.random.uuid()
      }

      const setResult = await cacheService.set(key, data)

      expect(setResult).toBe('OK')

      await cacheService.remove(key)

      const res = await cacheService.get(key)

      expect(res).toBeNil()

      return
    })

    test('#should remove multiple entries on flush pattern', async () => {
      const key1 = `test-${faker.random.alphaNumeric(24)}`
      const data1 = {
        text: faker.random.alphaNumeric(24),
        post: faker.random.uuid(),
        author: faker.random.uuid()
      }

      const key2 = `test-${faker.random.alphaNumeric(24)}`
      const data2 = {
        text: faker.random.alphaNumeric(24),
        post: faker.random.uuid(),
        author: faker.random.uuid()
      }

      const setResult1 = await cacheService.set(key1, data1)
      const setResult2 = await cacheService.set(key2, data2)

      expect(setResult1).toBe('OK')
      expect(setResult2).toBe('OK')

      await cacheService.flush('test*')

      const res1 = await cacheService.get(key1)
      const res2 = await cacheService.get(key2)

      expect(res1).toBeNil()
      expect(res2).toBeNil()

      return
    })
  })

  describe('CacheMiddleware', () => {

  })
})
