/*
 *
 * worker.js
 *
 * Author: Maurice T. Meyer
 * E-Mail: maurice@lavireo.com
 *
 * Date: 08-10-2016
 *
 * (c) Laviréo 2016
 */


const bind    = require('../helpers').bind;
const mixin   = require('../helpers').mixin;

//
// Worker class
module.exports = ((handle) =>
{
  //
  // Constructor
  function constr(opts)
  {
  };


  //
  // Methods
  mixin(constr.prototype, {
    /**
     * This is the worker entry point.
     *
     * @throws
     */
    perform: function ()
    {
      throw new Error('This method needs to be overwritten by subclasses.');
    }
  });


  //
  // Static Methods
  mixin(constr, {
    /**
     * Perform in n secs.
     *
     * @param {number} secs
     */
    perform_in: function (secs)
    {

    },

    /**
     * Perform at specific time.
     *
     * @param {number} time
     */
    perform_at: function (time)
    {

    }
  });

  return constr;
});
