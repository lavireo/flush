/*
 *
 * pool.js
 *
 * Author: Maurice T. Meyer
 * E-Mail: maurice@lavireo.com
 *
 * Date: 08-10-2016
 *
 * (c) Laviréo 2016
 */


const ejs      = require('ejs');
const promise  = require('promise');

const bind     = require('./helpers').bind;
const mixin    = require('./helpers').mixin;
const defaults = {
  SIZE:    5,
  TRIES:   2,
  TIMEOUT: 5
};

//
// Pool class
module.exports = (() =>
{
  /**
   * Constructor
   *
   * @param {function} up
   * @param {function} down
   * @param {object} opts
   */
  function constr(up, down, opts)
  {
    opts         = opts || {};
    this.__up    = up;
    this.__down  = down;
    this.__conns = [];

    //
    // Fill pool
    let i       = 0;
    let t       = 0;
    let conn_l  = opts.size  || defaults.SIZE;
    let tries_l = opts.tries || defaults.TRIES;
    while (i < conn_l && t < tries_l)
    {
      let res = up();
      if (res)
      {
        this.__conns.push(res);
        ++i;
        continue;
      }

      t++;
    }
  };


  //
  // Methods
  mixin(constr.prototype, {
    /**
     * Get connection from pool
     *
     * @param {object} opts
     * @return {promise}
     */
    do: function (opts)
    {
      return new promise((res, rej) => {
        if (!this.__conns || this.__conns.length < 1)
        {
          rej('No connections.');
          return;
        }

        let conn = this.__conns.shift()
        res(conn);
        this.__conns.push(conn);
      });
    },

    /**
     * Shutdown the pool
     *
     * @param {boolean} wait
     * @return {promise}
     */
    drain: function (wait)
    {
      return new promise((res, rej) => {
        if (!this.__conns)
        {
          res();
          return;
        }

        let    l = this.__conns.length - 1;
        while (l--)
        {
          this.__down(this.__conns[l]);
        }

        res();
      });
    }
  });


  //
  // Static Methods
  mixin(constr, {
  });

  return constr;
})();
