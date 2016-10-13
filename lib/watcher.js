/*
 *
 * watcher.js
 *
 * Author: Maurice T. Meyer
 * E-Mail: maurice@lavireo.com
 *
 * Date: 08-10-2016
 *
 * (c) Laviréo 2016
 */


const path    = require('path');
const emitter = require('events').EventEmitter;
const watcher = require('chokidar');

const bind    = require('./helpers').bind;
const mixin   = require('./helpers').mixin;

//
// Watcher class
module.exports = (() =>
{
  /**
   * Constructor
   *
   * @param {array} paths
   */
  function constr(base, paths)
  {
    emitter.call(this);


    this.__base = base;

    let i = 1;
    let l = paths.length;
    for (let p in paths)
    {
      if (!this.__watcher)
      {
        this.__watcher = watcher.watch(path.join(base, paths[p]), {
          depth:   25,
          ignored: /[\/\\]\./,
        });

        continue;
      }

      this.watch()
    }

    this.__watcher.on('all', (ev, path) =>
    {
      this.emit('change', path, ev);
    });
  };


  //
  // Extends
  util.inherits(constr, emitter);


  //
  // Methods
  mixin(constr.prototype, {
    __base:    null,
    __watcher: null,


    /**
     * Clear all watched directories
     *
     * @return {object}
     */
    clear: function ()
    {
      this.__watcher.close();
      this.removeAllListeners('change');
      return this;
    },

    /**
     * Watch directory at dir
     *
     * @param {string} dir
     * @return {object}
     */
    watch: function (dir, recursive = false)
    {
      this.__watcher.add(path.join(this.__base, dir));
      return this;
    },

    /**
     * Unwatch directory at path
     *
     * @param {string} path
     * @return {object}
     */
    unwatch: function (dir)
    {
      this.__watcher.remove(path.join(this.__base, dir));
      return this;
    },


    /**
     * Bind callback
     *
     * @param {function} fn
     * @param {object} ctx
     * @return {object}
     */
    bind: function (fn, ctx)
    {
      this.on('change', bind(fn, ctx || this));
      return this;
    },

    /**
     * Unbind certain callback
     *
     * @param {function} fn
     * @param {object} ctx
     * @return {object}
     */
    unbind: function (fn, ctx)
    {
      this.removeListener('change', bind(fn, ctx || this));
      return this;
    }
  });


  return constr;
})();
