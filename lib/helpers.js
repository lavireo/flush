/*
 *
 * utils.js
 *
 * Author: Maurice T. Meyer
 * E-Mail: maurice@lavireo.com
 *
 * Date: 23-09-2016
 *
 * (c) Laviréo 2016
 */


const crypto = require('crypto');

var mixin = (target, source) =>
{
  source = source || {};
  for(var key in source)
  {
    target[key] = source[key];
  }

  return target;
};

mixin(exports, {
  bind: (fn, ctx) =>
  {
    return function ()
    {
      return fn.apply(ctx, arguments);
    }
  },

  mixin: mixin,

  checksum: (str, algorithm, encoding) =>
  {
    return crypto
      .createHash(algorithm || 'md5')
      .update(str, 'utf8')
      .digest(encoding || 'hex')
  }
});
