/*
 *
 * mailer.js
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
// Mailer class
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
    send: function ()
    {
      throw new Error('This method needs to be overwritten by subclasses.');
    },


  });


  //
  // Static Methods
  mixin(constr, {
    /**
     * Send now.
     */
    send: function ()
    {

    },

    /**
     * Send later.
     */
    send_later: function ()
    {

    }
  });

  return constr;
});
