const cache = require('memory-cache');
const logger = require('../utils/logger');

const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    const key = '__express__' + req.originalUrl || req.url;
    const cachedBody = cache.get(key);

    if (cachedBody) {
      logger.debug(`Cache hit for ${key}`);
      return res.send(cachedBody);
    } else {
      logger.debug(`Cache miss for ${key}`);
      res.sendResponse = res.send;
      res.send = (body) => {
        cache.put(key, body, duration * 1000);
        res.sendResponse(body);
      };
      next();
    }
  };
};

module.exports = cacheMiddleware; 