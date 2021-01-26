import flatCache from 'flat-cache'

const cache = flatCache.load('esteemed-api')

export const middleware = (req, res, next) => {
  const key =  '__express__' + req.originalUrl || req.url
  const cacheContent = cache.getKey(key)

  if (cacheContent) {
    res.send(JSON.parse(cacheContent))
  }
  else {
    res.sendResponse = res.send
    res.send = (body) => {
      cache.setKey(key,body)
      cache.save()
      res.sendResponse(body)
    }

    next()
  }
}
