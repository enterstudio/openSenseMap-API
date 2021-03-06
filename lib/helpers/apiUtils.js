'use strict';

const { NotAuthorizedError, UnsupportedMediaTypeError } = require('restify-errors'),
  { config: { basePath } } = require('../utils'),
  apicache = require('apicache');

const addCache = function addCache (duration, group) {
  // configure the apicache, set the group and only cache response code 200 responses
  const apicacheMiddlewareFunction = function apicacheMiddlewareFunction (req, res) {
    req.apicacheGroup = group;

    return res.statusCode === 200;
  };

  return apicache.middleware(duration, apicacheMiddlewareFunction);
};

const clearCache = function clearCache (identifiers) {
  if (Array.isArray(identifiers)) {
    for (const identifier of identifiers) {
      apicache.clear(identifier);
    }
  } else {
    apicache.clear(identifiers);
  }
};

/**
 * @apiDefine ContentTypeJSON
 *
 * @apiHeader {String="application/json","application/json; charset=utf-8"} content-type
 * @apiError {Object} 415 the request has invalid or missing content type.
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 415 Unsupported Media Type
 *     {"code":"NotAuthorized","message":"Unsupported content-type. Try application/json"}
 */
const checkContentType = function (req, res, next) {
  if (!req.is('json')) {
    return next(new UnsupportedMediaTypeError('Unsupported content-type. Try application/json'));
  }

  return next();
};

const validUnsecuredPathRegex = new RegExp(`^\\${basePath}/[a-f\\d]{24}/((data)|([a-f\\d]{24}))/?$`, 'i');
const preRequest = function preRequest (request, response, next) {
  response.charSet('utf-8');
  request.log.info({ req: request }, 'REQUEST');

  if (process.env.ENV === 'prod'
    && (!request.headers['x-forwarded-proto'] || request.headers['x-forwarded-proto'] !== 'https')) {
    if (request.method !== 'POST' || !validUnsecuredPathRegex.test(request.url)) {
      return next(new NotAuthorizedError('Access through http is not allowed'));
    }
  }

  return next() ;
};

// sends out CORS headers
const preCors = function preCors (request, response, next) {
  if (!response.getHeader('access-control-allow-origin')) {
    response.header('access-control-allow-origin', '*');
  }

  if (!response.getHeader('access-control-allow-methods')) {
    const allowedMethods = new Set(['OPTIONS']);
    if (request.header('access-control-request-method')) {
      allowedMethods.add(request.header('access-control-request-method').toUpperCase());
    }
    allowedMethods.add(request.method.toUpperCase());

    response.header('access-control-allow-methods', Array.from(allowedMethods)
      .reverse()
      .join(', '));
  }

  if (!response.getHeader('access-control-allow-headers')) {
    const allowedHeaders = new Set(['authorization']);
    if (request.header('access-control-request-headers')) {
      allowedHeaders.add(request.header('access-control-request-headers').toLowerCase());
    }

    response.header('access-control-allow-headers', Array.from(allowedHeaders).join(', '));
  }

  if (!response.getHeader('access-control-max-age')) {
    response.header('access-control-max-age', 600);
  }

  if (request.method === 'OPTIONS') {
    return response.send(204);
  }

  return next();
};

module.exports = {
  addCache,
  clearCache,
  checkContentType,
  preRequest,
  preCors
};
