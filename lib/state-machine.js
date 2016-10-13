/*
 *
 * stateMachine.js
 *
 * Author: Maurice T. Meyer
 * E-Mail: maurice@lavireo.com
 *
 * Date: 08-10-2016
 *
 * (c) Laviréo 2016
 */


const util    = require('util');
const emitter = require('events').EventEmitter;

const bind    = require('./helpers').bind;
const mixin   = require('./helpers').mixin;

//
// StateMachine class
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
  };


  //
  // Extends
  util.inherits(constr, emitter);


  //
  // Methods
  mixin(constr.prototype, {
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
